---
layout: post
title: Agrandir un LUN présenté à un serveur Linux
comments: True
---

Nous allons voir dans cet article les différentes étapes pour agrandir un LUN présenté à un serveur Linux. La méthode a le grand avantage de pouvoir se faire en ligne ce qui est plutôt confortable si on aime bien pouvoir rentrer chez soi le soir ou le weekend...
Pour résumer, l'opération se déroulera en 4 étapes:

- Agrandir le LUN sur la baie SAN
- Faire en sorte que le serveur Linux voit les modifications au niveau multipathing
- Agrandir tous les éléments des LVM (PV/VG/LV)
- Agrandir le système de fichiers

Je ne traiterai pas de tout ce qui concerne la baie SAN car l'opération est différente en fonction des constructeurs / baies. Nous allons nous concentrer sur la partie Linux.

> Pour rappel: Pensez à faire des sauvegardes !!!

### Configuration du serveur de test

Le serveur utilisé pour les tests est un HP proliant DL380 G6. L'OS utilisé est une Red Hat Enterprise Linux 6.3. Le serveur est nommé `SRV01`. La baie SAN est une EMC VNX5300.
Le volume qui sera agrandi est vu par l'OS en tant que `/dev/mapper/mpathj`. La gestion de la redondance des liens est gérée par multipathd. Le volume est géré par LVM et est simplement composé d'un PV, un VG et un LV.
La taille d'origine est 10 Go, nous allons l'agrandir jusqu'à 50 Go.

### Liste des commandes
##### Prise en compte par l'OS de l'agrandissement du LUN

Lancer la commande `multipath -ll`. Prenez note des différents devices qui pointent vers le LUN (ici sdg, sdm,sds et sdy).

```
srv01:root:/root> multipath -ll mpathj
mpathj (36006016072312f00563e92d8039de511) dm-4 DGC,VRAID
size=10G features='1 queue_if_no_path' hwhandler='1 emc' wp=rw
|-+- policy='round-robin 0' prio=1 status=active
| |- 3:0:0:14 sdg 8:96   active ready  running
| `- 4:0:0:14 sdm 8:192  active ready  running
`-+- policy='round-robin 0' prio=0 status=enabled
  |- 3:0:1:14 sds 65:32  active ready  running
  `- 4:0:1:14 sdy 65:128 active ready  running
```

Faire un rescan de ces devices pour que l'OS voit que le LUN a été agrandi.

```
srv01:root:/root> echo 1 > /sys/block/sdg/device/rescan
srv01:root:/root> echo 1 > /sys/block/sdm/device/rescan
srv01:root:/root> echo 1 > /sys/block/sds/device/rescan
srv01:root:/root> echo 1 > /sys/block/sdy/device/rescan
```

Recharger la configuration du multipathing pour la prise en compte des modifications.

```
srv01:root:/root> multipath -r
```

En relançant la commande `multipath -ll` on peut valider que la taille du volume est bien de 50 Go.

```
srv01:root:/root> multipath -ll mpathj
mpathj (36006016072312f00563e92d8039de511) dm-4 DGC,VRAID
size=50G features='1 queue_if_no_path' hwhandler='1 emc' wp=rw
|-+- policy='round-robin 0' prio=1 status=active
| |- 3:0:0:14 sdg 8:96   active ready  running
| `- 4:0:0:14 sdm 8:192  active ready  running
`-+- policy='round-robin 0' prio=0 status=enabled
  |- 3:0:1:14 sds 65:32  active ready  running
  `- 4:0:1:14 sdy 65:128 active ready  running
```

##### Agrandissement du PV / VG / LV

Maintenant que l'OS est au courant des changements, il reste à agrandir tous les éléments gérés par LVM. La commande `pvs` affiche des informations sur les PV existants.

```
srv01:root:/root> pvs /dev/mapper/mpathj
  PV                 VG   Fmt  Attr PSize   PFree
  /dev/mapper/mpathj vg05 lvm2 a-     9,00g    0
```

La commande `pvresize` permet d'agrandir le PV en utilisant tout l'espace disponible sur le device.

```
srv01:root:/root> pvresize /dev/mapper/mpathj
  Physical volume "/dev/mapper/mpathj" changed
  1 physical volume(s) resized / 0 physical volume(s) not resized
```

En relançant la commande `pvs`, on peut voir que la taille du PV à bien augmenté.

```
srv01:root:/root> pvs /dev/mapper/mpathj
  PV                 VG   Fmt  Attr PSize   PFree
  /dev/mapper/mpathj vg05 lvm2 a-    49,00g 40,00g
```

Augmenter la taille du PV entraine automatiquement l'agrandissement du VG. On peut le vérifier avec la commande `vgs`.

```
srv01:root:/root> vgs vg05
  VG   #PV #LV #SN Attr   VSize   VFree
  vg05   1   1   0 wz--n-  49,00g 40,00g
```

Reste maintenant à augmenter la taille du LV, `lvs` permet d'obtenir des infos sur les LV existants.

```
srv01:root:/root> lvs lv05
  LV   VG   Attr   LSize   Origin Snap%  Move Log Copy%  Convert
  lv05 vg05 -wi-ao   9,00g
```

`lvextend` avec l'argument `-l +100%FREE` va agrandir le LV en prenant tout l'espace disponible sur le VG.

```
srv01:root:/root> lvextend -l +100%FREE /dev/vg05/lv05
  Extending logical volume lv05 to 49,00 GiB
  Logical volume lv05 successfully resized
```

On peut vérifier que le LV a bien été agrandi avec, encore une fois, la commande `lvs`.

```
srv01:root:/root> lvs lv05
  LV   VG   Attr   LSize   Origin Snap%  Move Log Copy%  Convert
  lv05 vg05 -wi-ao  49,00g
```

##### Resize du file system

Dernière étape ! On va agrandir le file system. La commande `df -h` permet d'avoir des informations sur les files systems existants.

```
srv01:root:/root> df -h
Sys. de fichiers    Taille  Uti. Disp. Uti% Monté sur
/dev/sda2              58G  6,2G   49G  12% /
tmpfs                  48G     0   48G   0% /dev/shm
/dev/sda1             194M   89M   95M  49% /boot
/dev/mapper/vg01-lv01
                      492G  459G  7,9G  99% /u01
/dev/mapper/vg02-lv02
                      1,5T  1,4T   75G  95% /u02
/dev/mapper/vg03-lv03
                      492G   56G  411G  12% /u03
/dev/mapper/vg04-lv04
                      8,9G  6,6G  1,9G  78% /u04
/dev/mapper/vg05-lv05
                      8,9G  3,4G  5,2G  40% /u05
```

`resize2fs` va agrandir le file system de manière transparente pour les utilisateurs. Notez bien qu'il faut utiliser le device généré par LVM `/dev/mapper/vg05-lv05` au lieu de celui géré par multipathd. `/dev/mapper/mpathj`.  

```
srv01:root:/root> resize2fs /dev/mapper/vg05-lv05
resize2fs 1.41.12 (17-May-2010)
Le système de fichiers de /dev/mapper/vg05-lv05 est monté sur /u05 ; le changement de taille doit être effectué en ligne
old desc_blocks = 1, new_desc_blocks = 4
En train d'effectuer un changement de taille en ligne de /dev/mapper/vg05-lv05 vers 12845056 (4k) blocs.
Le système de fichiers /dev/mapper/vg05-lv05 a maintenant une taille de 12845056 blocs.
```

On vérifie avev la commande `df` que le file system a bien la taille désirée.

```
srv01:root:/root> df -h /dev/mapper/vg05-lv05
Sys. de fichiers    Taille  Uti. Disp. Uti% Monté sur
/dev/mapper/vg05-lv05
                       49G  3,4G   43G   8% /u05
```

{% include twitter.html %}
