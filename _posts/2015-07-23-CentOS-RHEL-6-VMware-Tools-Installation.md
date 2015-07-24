---
layout: post
title: Installation des VMware Tools sur une VM CentOS / RHEL 6.6 minimal
comments: True
---

Il existe plusieurs méthodes pour installer les VMware Tools sur un OS CentOS / RHEL 6.6. Vous pouvez les déployer soit:

- via le web client ou le viclient
- en installant les open-vm-tools

Je préfère la deuxième méthode car l'installation et la mise à jour se font grâce aux gestionnaires de packages de votre distribution (yum, apt-get...). De plus l'empreinte sur le système est bien moins importante. Bien sûr VMware supporte officiellement cette méthode d'installation tant que l'OS est présent dans la [VMware Compatibility Matrix](http://www.vmware.com/resources/compatibility/search.php?deviceCategory=guestos).

> La méthode présenté ci-dessous concerne bien que les version 6.X de CentOS / RHEL. A partir de la version 7.0 les packages open-vm-tools sont disponibles de base dans les repository des distribs.

### Installation des clés du repository VMware

```
rpm --import http://packages.vmware.com/tools/keys/VMWARE-PACKAGING-GPG-DSA-KEY.pub
rpm --import http://packages.vmware.com/tools/keys/VMWARE-PACKAGING-GPG-RSA-KEY.pub
```

### Création du fichier de configuration du repository

```
cat << EOF > /etc/yum.repos.d/vmware-tools.repo
[vmware-tools]
name=VMware Tools
baseurl = http://packages.vmware.com/tools/esx/latest/rhel6/\$basearch
enabled = 1
gpgcheck = 1
EOF
```

L'adresse indiquée dans `baseurl` est à modifier en fonction de votre environnement. Par exemple pour avoir la dernière version des VMware Tools pour une infrastructure vSphere 5.5 il faudra fournir l'adresse suivante:

```
http://packages.vmware.com/tools/esx/5.5latest/rhel6/\$basearch
```

### Installation des VMware Tools

```
yum install -y vmware-tools-esx-nox
```

Les packages suivants seront installés

```
Dependencies Resolved

==========================================================================================================
 Package                                  Arch        Version                     Repository         Size
==========================================================================================================
Installing:
 vmware-tools-esx-nox                     x86_64      9.10.1-1.el6                vmware-tools      3.1 k
Installing for dependencies:
 perl                                     x86_64      4:5.10.1-136.el6_6.1        updates            10 M
 perl-Module-Pluggable                    x86_64      1:3.90-136.el6_6.1          updates            40 k
 perl-Pod-Escapes                         x86_64      1:1.04-136.el6_6.1          updates            32 k
 perl-Pod-Simple                          x86_64      1:3.13-136.el6_6.1          updates           212 k
 perl-libs                                x86_64      4:5.10.1-136.el6_6.1        updates           578 k
 perl-version                             x86_64      3:0.77-136.el6_6.1          updates            51 k
 vmware-tools-core                        x86_64      9.10.1-1.el6                vmware-tools      4.0 M
 vmware-tools-foundation                  x86_64      9.10.1-1.el6                vmware-tools      107 k
 vmware-tools-guestlib                    x86_64      9.10.1-1.el6                vmware-tools       62 k
 vmware-tools-libraries-nox               x86_64      9.10.1-1.el6                vmware-tools      4.2 M
 vmware-tools-plugins-autoUpgrade         x86_64      9.10.1-1.el6                vmware-tools      5.6 k
 vmware-tools-plugins-deployPkg           x86_64      9.10.1-1.el6                vmware-tools       44 k
 vmware-tools-plugins-grabbitmqProxy      x86_64      9.10.1-1.el6                vmware-tools      404 k
 vmware-tools-plugins-guestInfo           x86_64      9.10.1-1.el6                vmware-tools       21 k
 vmware-tools-plugins-hgfsServer          x86_64      9.10.1-1.el6                vmware-tools      5.7 k
 vmware-tools-plugins-powerOps            x86_64      9.10.1-1.el6                vmware-tools      7.3 k
 vmware-tools-plugins-timeSync            x86_64      9.10.1-1.el6                vmware-tools      9.8 k
 vmware-tools-plugins-vix                 x86_64      9.10.1-1.el6                vmware-tools       97 k
 vmware-tools-plugins-vmbackup            x86_64      9.10.1-1.el6                vmware-tools       14 k
 vmware-tools-services                    x86_64      9.10.1-1.el6                vmware-tools      363 k
 vmware-tools-vgauth                      x86_64      9.10.1-1.el6                vmware-tools      429 k

Transaction Summary
==========================================================================================================
Install      22 Package(s)

Total download size: 21 M
Installed size: 64 M
```


### Arrêter / Démarrer le service VMware Tools

Les services sont gérés par Upstart et non pas le démon init. La syntaxe à utiliser est la suivante:

```
status vmware-tools-services
stop vmware-tools-services
start vmware-tools-services
```

{% include twitter.html %}
