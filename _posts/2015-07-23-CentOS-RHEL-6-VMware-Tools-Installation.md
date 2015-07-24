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
cat << EOF > /tmp/test.repo
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

### Arrêter / Démarrer le service VMware Tools

Les services sont gérés par Upstart et non pas le démon init. La syntaxe à utiliser est la suivante:

```
status vmware-tools-services
stop vmware-tools-services
start vmware-tools-services
```

{% include twitter.html %}
