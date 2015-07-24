---
layout: post
title: Préparation d'une VM Linux CentOS / RHEL 6.6 minimal pour devenir un template
comments: True
---

La préparation d'une VM Linux Centos / RHEL pour la transformer en template est une tache souvent négligée. ll n'est pas rare, après avoir déployé la VM, de pouvoir accéder aux commandes exécutées  par l'administrateur lors de la préparation du template... Je ne sais pas pour vous mais je n'aime pas forcement l'idée que quelqu'un d'autre voit mes différentes tentatives pour taper correctement une commande ! Sans parler de toutes les informations qui peuvent se retrouver dans les logs...

Je vous propose donc une liste de commandes que j'utilise. Elles ont été testées sur une CentOS 6.6 minimal mais elles devraient être compatibles avec les autres ditros de la même famille (RHEL, Oracle Linux...).

Je pars du principe que l'OS est installé et qu'un accès à internet est possible pour les mises à jours avec `yum`. Vous verrez dans les commandes que j'ai fait le choix d'installer les `open-vm-tools`. Je vous invite à lire cet [article](http://blog.okcomputer.io/2015/07/23/CentOS-RHEL-6-VMware-Tools-Installation/) pour savoir pourquoi.

J'ai scindé le script en 2 car il est nécessaire de rebooter l'OS pour prendre en compte les mises à jour.

### Première partie

{% gist 4dcda9f85f3c7e2ccb93 %}

### Deuxième partie

{% gist 5cedbdc3a98c97558319 %}

Après tout ça vous n'aurez plus qu'à transformer votre VM en template. Attention, si vous devez redémarrer votre VM il faudra repasser les commandes du deuxième script.

J'espère que ces informations vous aurons été utiles ! Vous pouvez vous attendre à voir un prochain article dédié à la préparation d'une VM CentOS / RHEL 7.X.

{% include twitter.html %}
