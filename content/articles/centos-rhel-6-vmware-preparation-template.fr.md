{
  "title": "Préparation d'une VM Linux CentOS / RHEL 6.6 minimal pour devenir un template",
  "date": "2015-07-24T12:00:00+01:00",
  "slug": "centos-rhel-6-vmware-preparation-template",
  "translationKey": "centos-rhel-6-vmware-preparation-template",
  "aliases": [
    "../../2015/07/24/CentOS-RHEL-6-VMware-Preparation-Template/"
  ],
  "tags": [
    "VMware",
    "Linux"
  ],
  "legacy": true,
  "draft": false
}


La préparation d'une VM Linux Centos / RHEL pour la transformer en template est une tache souvent négligée. ll n'est pas rare, après avoir déployé la VM, de pouvoir accéder aux commandes exécutées  par l'administrateur lors de la préparation du template... Je ne sais pas pour vous mais je n'aime pas forcement l'idée que quelqu'un d'autre voit mes différentes tentatives pour taper correctement une commande ! Sans parler de toutes les informations qui peuvent se retrouver dans les logs...

Je vous propose donc une liste de commandes que j'utilise. Elles ont été testées sur une CentOS 6.6 minimal mais elles devraient être compatibles avec les autres ditros de la même famille (RHEL, Oracle Linux...).

Je pars du principe que l'OS est installé et qu'un accès à internet est possible pour les mises à jours avec `yum`. Vous verrez dans les commandes que j'ai fait le choix d'installer les VMware Tools depuis le repository VMware. Je vous invite à lire cet [article](/2015/07/23/CentOS-RHEL-6-VMware-Tools-Installation/) pour savoir pourquoi.

J'ai scindé le script en 2 car il est nécessaire de rebooter l'OS pour prendre en compte les mises à jour.

### Première partie

```bash
# Désactivation logs le temps de la préparation du template
/sbin/service rsyslog stop
/sbin/service auditd stop

# Désactivation SELINUX (optionnel)
/usr/sbin/setenforce 0
sed -i -e 's!^SELINUX=.*!SELINUX=disabled!' /etc/selinux/config

# Désactivation IPTABLES (optionnel)
/sbin/service iptables stop
/sbin/service ip6tables stop

/sbin/chkconfig iptables off
/sbin/chkconfig ip6tables off

# Préparation installation des VMware Tools
rpm --import http://packages.vmware.com/tools/keys/VMWARE-PACKAGING-GPG-DSA-KEY.pub
rpm --import http://packages.vmware.com/tools/keys/VMWARE-PACKAGING-GPG-RSA-KEY.pub

cat << EOF > /etc/yum.repos.d/vmware-tools.repo
[vmware-tools]
name=VMware Tools
baseurl = http://packages.vmware.com/tools/esx/latest/rhel6/\$basearch
enabled = 1
gpgcheck = 1
EOF

# Mise à jour globale de l'OS
yum update -y

# Installation packages WGET, NTPD et YUM-UTILS (pour package-cleanup) et VMware Tools
yum install -y ntp yum-utils vmware-tools-esx-nox

# Démarrage service NTPD
/sbin/service ntpd start
/sbin/chkconfig ntpd on

# Redémarrage de l'OS
shutdown -r now
```

[Source du script sur GitHub Gist](https://gist.github.com/equelin/4dcda9f85f3c7e2ccb93)

### Deuxième partie

```bash
# Désactivation logs le temps de la préparation du template
/sbin/service rsyslog stop
/sbin/service auditd stop

# Suppression anciens kernels
/usr/bin/package-cleanup --oldkernels --count=1 -y

#Suppression traces YUM
/usr/bin/yum clean all

# Force la rotation des logs en fonctions des parametres définis dans /etc/logrotate.conf
/usr/sbin/logrotate -f /etc/logrotate.conf

#Supprime les archives des logs
/bin/rm -f /var/log/*-???????? /var/log/*.gz
/bin/rm -f /var/log/dmesg.old
/bin/rm -rf /var/log/anaconda

#Vide les logs sans avoir à redémarrer les services correspondants
/bin/cat /dev/null > /var/log/audit/audit.log
/bin/cat /dev/null > /var/log/wtmp
/bin/cat /dev/null > /var/log/lastlog
/bin/cat /dev/null > /var/log/grubby

# Supprime les traces de la carte réseau de la VM dans udev et dans ifcfg-eth0 - A adapter si vous avez plusieurs cartes réseaux
/bin/rm -f /etc/udev/rules.d/70*

/bin/sed -i '/^HWADDR=/d' /etc/sysconfig/network-scripts/ifcfg-eth0
/bin/sed -i '/^UUID=/d' /etc/sysconfig/network-scripts/ifcfg-eth0

# Vide les répertoires /tmp et /var/tmp
/bin/rm -rf /tmp/*
/bin/rm -rf /var/tmp/*

# Supprime les clés SSH de la VM (elles seront regenerees au prochain démarrage)
/bin/rm -f /etc/ssh/*key*

# Supprime les clés SSH du compte root
/bin/rm -rf ~root/.ssh/

# Supprime le fichier kickstart généré par anaconda lors de l'installation de l'OS
/bin/rm -f ~root/anaconda-ks.cfg

# Supprime l'historique des commandes du compte root
/bin/rm -f ~root/.bash_history
unset HISTFILE

# Arrête la VM
/sbin/shutdown -h now
```

[Source du script sur GitHub Gist](https://gist.github.com/equelin/5cedbdc3a98c97558319)

Après tout ça vous n'aurez plus qu'à transformer votre VM en template. Attention, si vous devez redémarrer votre VM il faudra repasser les commandes du deuxième script.

J'espère que ces informations vous aurons été utiles ! Vous pouvez vous attendre à voir un prochain article dédié à la préparation d'une VM CentOS / RHEL 7.X.

### Sources

Qu'on se le dise, je n'ai aucunement la prétention d'être un gourou Linux ! La plupart des commandes présentent dans cet article proviennent de différents blogs. Malheureusement je n'ai aucune trace des noms des auteurs qui ont pu "m'inspirer"... Si vous avez des infos, n'hésitez pas à me les communiquer.
