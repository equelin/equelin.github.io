---
layout: post
title: Modification du fonctionnement d'UNMAP avec ESXi 5.5 et 6.0
---

La lecture de cet [article](http://www.codyhosterman.com/2015/07/unmap-block-count-behavior-change-in-esxi-5-5-p3/) écrit par [Cody Hosterman](https://twitter.com/codyhosterman) m'a amené à revoir le script PowerCLI que je vous avais présenté dans un précèdent [post](http://blog.okcomputer.io/2015/03/26/VMware-ESXi-UNMAP-PowerCLI/).

Cody y explique que le comportement de la primitive UNMAP a changé depuis les derniers patchs ESXi 5.5 (patch 3 build   2143827 pour être exacte) ainsi que dans ESXi 6.0. Ces modifications ont été apportées afin d'éviter un purple screen (sic) lorsque qu'on utilise la primitive UNMAP en changeant le nombre de blocs à réclamer. La solution proposée par VMware a été de fixer ce nombre de blocs à 1% de l'espace libre restant sur le datastore.

J'ai modifié le script pour prendre en compte le pourcentage recommandé par VMware. Vous pourrez l'executer même si vous n'avez pas la dernière version de patch. Il est bien sur fortement recommandé de mettre à jour vos serveurs ESXi.

{% gist 5e035816236f46cde25e %}

Le fonctionnement du script a légerement changé. Il va automatiquement choisir un des hosts qui a accès au datastore pour executer la primitive UNMAP. Le ou les datastores peuvent être indiqués avec l'argument *-Datastore* ou bien par le pipeline *Get-Datastore | .\ReclaimUnusedSpace.ps1*

 Bien entendu vous trouverez le script complet sur [GitHub](https://github.com/equelin/vmware-powercli/blob/master/UNMAP/ReclaimUnusedSpace.ps1).
