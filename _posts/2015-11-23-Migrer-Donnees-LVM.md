---
layout: post
title: Déplacer des données gérées par LVM avec pvmove
comments: True
---

Je vous propose de détailler le fonctionnement de la commande `pvmove` qui permet, comme son nom l'indique, de déplacer des données d'un volume physique (PV) à un autre. Cette méthode a le grand avantage de pouvoir s'exécuter à chaud. Les cas d'usages possibles sont par exemple de faciliter le remplacement d'un disque ou bien déplacer les données d'une baie SAN à une autre.

> Avant de commencer à jouer avec des données de production je vous conseille fortement de réaliser des tests pour être complètement à l'aise avec les commandes LVM. Faire une sauvegarde pourrait être aussi une bonne idée !

Vous aurez deviné que la commande `pvmove` n'est utilisable que si votre stockage est géré par LVM. Si vous n'êtes pas famillier avec ces notions, il existe une multitude d'[articles](https://access.redhat.com/documentation/en-US/Red_Hat_Enterprise_Linux/7/html/Logical_Volume_Manager_Administration/LVM_definition.html) sur le [sujet](http://lea-linux.org/documentations/Leapro-pro_sys-lvm).

### Configuration du serveur de test

Pour les besoins de la démonstration j'utilise une machine virtuelle sur laquelle j'ai installé une CentOS 7.1. Les données sont stockées sur le device `/dev/sdb` qui fait partie du VG `vgtest`. Le but de l'opération est de tout déplacer vers un nouveau device `/dev/sdc` puis de supprimer `/dev/sdb`.

###  Méthodologie

Un (bon) schéma étant souvent plus parlant qu'un long texte, j'ai résumé les différentes étapes dans l'image ci-dessous:

![image](https://blog.okcomputer.io/img/2015-11-23-Migrer-Donnees-LVM-01.jpg "Methodologie pvmove")

### Liste des commandes

##### Découverte du nouveau device cible

```
# for x in `ls /sys/class/scsi_host/`; do echo "- - -" > /sys/class/scsi_host/$x/scan ; done
```

##### Création d'un PV sur le nouveau device (/dev/sdc)

```
# pvcreate /dev/sdc
  Physical volume "/dev/sdc" successfully created
```

##### Ajout du nouveau device dans le VG

```
# vgextend vgtest /dev/sdc
  Volume group "vgtest" successfully extended
```

##### Déplacement des données de /dev/sdb vers /dev/sdc

L'argument `-b` permet d'exécuter la commande en tâche de fond.

```
# pvmove -b /dev/sdb /dev/sdc
```

##### Suivi de l'évolution de la copie des données

La colonne `Cpy%Sync` indique le pourcentage des données déjà déplacées.

```
# watch lvs -a -o+devices
LV        VG     Attr       LSize  Pool Origin Data%  Meta%  Move     Log Cpy%Sync Convert Devices
root      centos -wi-ao---- 13.91g                                                         /dev/sda2(410)
swap      centos -wi-ao----  1.60g                                                         /dev/sda2(0)
lvtest    vgtest -wI-ao---- 10.00g                                                         pvmove0(0)
[pvmove0] vgtest p-C-aom--- 10.00g                           /dev/sdb     7.89             /dev/sdb(0),/dev/sdc(0)
```

##### Suppression de l'ancien device /dev/sdb du VG

```
# vgreduce vgtest /dev/sdb
  Removed "/dev/sdb" from volume group "vgtest"
```

##### Suppression du PV du device /dev/sdb

```
# pvremove /dev/sdb
  Labels on physical volume "/dev/sdb" successfully wiped
```

##### Suppression du device /dev/sdb

```
# echo 1 > /sys/block/sdb/device/delete
```

{% include twitter.html %}
