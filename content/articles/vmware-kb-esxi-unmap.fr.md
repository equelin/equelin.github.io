{
  "title": "Modification du fonctionnement d'UNMAP avec ESXi 5.5 et 6.0",
  "date": "2015-07-13T12:00:00+01:00",
  "slug": "vmware-kb-esxi-unmap",
  "translationKey": "vmware-kb-esxi-unmap",
  "aliases": [
    "../../2015/07/13/VMware-KB-ESXi-UNMAP/"
  ],
  "tags": [
    "VMware",
    "Stockage"
  ],
  "legacy": true,
  "draft": false
}


> Mise à jour 23/03/2016: Script modifié suite à la découverte d'un bug.

La lecture de cet [article](http://www.codyhosterman.com/2015/07/unmap-block-count-behavior-change-in-esxi-5-5-p3/) écrit par [Cody Hosterman](https://twitter.com/codyhosterman) m'a amené à revoir le script PowerCLI que je vous avais présenté dans un précèdent [post](/2015/03/26/VMware-ESXi-UNMAP-PowerCLI/).

Cody y explique que le comportement de la primitive UNMAP a changé depuis les derniers patchs ESXi 5.5 (patch 3 build   2143827 pour être exacte) ainsi que dans ESXi 6.0. Ces modifications ont été apportées afin d'éviter un purple screen (sic) lorsque qu'on utilise la primitive UNMAP en changeant le nombre de blocs à réclamer. La solution proposée par VMware a été de fixer ce nombre de blocs à 1% de l'espace libre restant sur le datastore.

J'ai modifié le script pour prendre en compte le pourcentage recommandé par VMware. Vous pourrez l'executer même si vous n'avez pas la dernière version de patch. Il est bien sur fortement recommandé de mettre à jour vos serveurs ESXi.

```powershell
<#
.SYNOPSIS
  Reclame l'espace libre sur les datastores en thin provisionning.

.DESCRIPTION
  Reclame l'espace libre sur les datastores en thin provisionning.

.PARAMETER Datastore
  Nom d'un datastore sur lequel sera reclame l'espace libre. le datastore peut etre passé en argument.

.NOTES
  Il est necessaire d etre connecte a un serveur vCenter ou ESXi avant d'executer ce script. Ce script est compatible à partir de vSphere 5.5.
  Le code est en parti inspiré par le travaille de Cody Hosterman (http://blog.purestorage.com/unmap-block-count-behavior-change-in-esxi-5-5-p3/)

.EXAMPLE
  Get-Datastore | ReclaimUnusedSpace.ps1

  Reclamer l'espace libre sur tous les datasores.

.EXAMPLE
  ReclaimUnusedSpace.ps1 -Datastore NomDuDatastore

  Reclamer l'espace libre sur un datasore specifique.

.LINK
  http://blog.okcomputer.io
#>

Param (
  [Parameter(Mandatory=$True,ValueFromPipeline=$True,ValueFromPipelinebyPropertyName=$True)]
  [string]$Datastore
)

# Desactivation du Timeout car l'operation peut-être longue
Set-PowerCLIConfiguration -Scope Session -WebOperationTimeoutSeconds -1 -confirm:$false | Out-Null

# Récupere les informations sur le ou les datastore(s)
$Datastores = Get-Datastore -Name $Datastore

# Réclamation de l'espace libre sur chaque datastore
foreach ($DS in $Datastores) {
  Process {

    # Calcul de la taille du fichier asyncUnmapFile - Source: http://blog.purestorage.com/unmap-block-count-behavior-change-in-esxi-5-5-p3/
    if ((1 - $DS.FreeSpaceMB/$DS.CapacityMB) -ge .75) {
      $asyncUnmapFileSize = 200
    }
    else {
      $asyncUnmapFileSize = [math]::floor($DS.FreeSpaceMB * .01)
    }

    # Selection du serveur ESXi qui executera l'operation
    $VMHost = $DS | Get-VMHost | where-object {($_.version -like "5.5.*") -or ($_.version -like "6.0.*")} | Select-Object -last 1

    # Esxcli
    $esxcli = Get-VMHost -Name $VMHost | Get-EsxCli

    Write-Host "Reclamation de l'espace libre sur $($DS.name) par bloc de $asyncUnmapFileSize Mo et depuis le serveur $VMHost"

    #Execution de la commande avec gestion des erreurs
    Try {
      $result = $esxcli.storage.vmfs.unmap($asyncUnmapFileSize, $DS.name, $null)
    }
    Catch [VMware.VimAutomation.Sdk.Types.V1.ErrorHandling.VimException.ViError] {
      Write-Host "Erreur lors de la reclamation de l'espace libre sur $($DS.name)"
      Write-Host $_.Exception.Message
    }
  }
}
```

[Source du script sur GitHub Gist](https://gist.github.com/equelin/5e035816236f46cde25e)

Le fonctionnement du script a légerement changé. Il va automatiquement choisir un des hosts qui a accès au datastore pour executer la primitive UNMAP. Le ou les datastores peuvent être indiqués avec l'argument *-Datastore* ou bien par le pipeline *Get-Datastore | .\ReclaimUnusedSpace.ps1*

 Bien entendu vous trouverez le script complet sur [GitHub](https://github.com/equelin/vmware-powercli/blob/master/UNMAP/ReclaimUnusedSpace.ps1).
