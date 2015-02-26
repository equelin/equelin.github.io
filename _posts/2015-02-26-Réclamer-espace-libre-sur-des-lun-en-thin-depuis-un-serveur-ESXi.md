---
layout: post
title: Réclamer de l'esapce libre sur des LUN thin avec VMware ESXi
---

VMware a introduit avec la version 5.0 une nouvelle primitive VAAI (UNMAP) qui permet, dans le cas de LUN en thin provisionning, de réaffecter les blocks qui ne sont plus utilisé à l'espace libre. Le but étant de conserver les bénéfices du thin provisionning dans le temps. En version 5.0, l'invocation de cette primitive était géré automatiquement par les ESXi mais des problèmes de performance ont poussé VMware à la désactiver. Elle a été de nouveau disponible dans la version 5.0 U1 cependant l'exécution est maintenant manuelle. Le fonctionnement/efficacité de la primitive a été amélioré dans la version 5.5.

##VMware ESXi 5.0 U1 et 5.1:

Ci-dessous la procédure pour exécuter la primitive UNMAP:

1. Vérifier que le datastore supporte bien la primitive UNMAP
  1. esxcli storage core device list | more (noter le uid naa.)
  2. esxcli storage core device vaai status get -d <naa ID> (Vérifier la présence de ligne Zero Status: Supported)
2. Se positionner sur le datastore concerné
  1. cd /vmfs/volumes/nomdudatastore
3. Exécuter la primitive
  1. vmkfstools -y 60

###Remarques:

* La commande vmkfstools crée un fichier temporaire (.vmfsBalloon+suffix) dans lequel tous les blocks récupérés seront stockés avant d'êtres remis à zéro, le paramètre -y 60 indique que 60% des blocks libres seront remis à zéro, cela implique que le datastore devra disposer de suffisamment d'espace disque libre pour effectuer cette opération. En cas de doute, relancer la commande plusieurs fois avec un % inférieur.
* L'exécution de la primitive peut générer beaucoup d'I/O et de l'utilisation CPU, VMware recommande de réaliser ces opérations hors production.

##VMware ESXi 5.5

La commande vmkfstools n'est plus supportée depuis la version 5.5, elle a été remplacée par une commande esxcli. ci-dessous la procédure:

1. Vérifier que le datastore supporte bien la primitive UNMAP
  1. esxcli storage core device list | more (noter le uid naa.)
  2. esxcli storage core device vaai status get -d <naa ID> (Vérifier la présence de ligne Zero Status: Supported)
2. Exécuter la primitive
  1. esxcli storage vmfs unmap -l nomdudatastore -n nombredeblocks

###Remarques:

* La commande crée un fichier temporaire mais, à la différence des versions précédentes, la taille du fichier est définie par la valeur du paramètre -n (en Mo)
* HP recommande de spécifier une valeur importante pour le paramètre -n afin de réduire la durée d'exécution de la primitive
* VMware indique que la primitive peut être utilisée pendant les heures de production, il est quand même nécessaire de réaliser des tests au préalable.

##Sources:

##VMware ESXi 5.0 U1 et 5.1:

http://kb.vmware.com/selfservice/microsites/search.do?language=en_US&cmd=displayKC&externalId=2014849
http://www.boche.net/blog/index.php/2012/06/28/storage-starting-thin-and-staying-thin-with-vaai-unmap/

##VMware ESXi 5.5:
http://www.boche.net/blog/index.php/2013/09/13/vsphere-5-5-unmap-deep-dive/
