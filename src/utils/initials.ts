/** Monogramme d'une personne, pour le repli d'avatar sans photo.
 *
 *  L'expression était recopiée dans quatre composants, dont un sans garde sur
 *  les chaînes vides. */
export function getInitials(prenom: string, nom: string): string {
  return `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase()
}
