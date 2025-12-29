export interface Channel {
  id: number
  name: string
}

// Ajout du type ChannelConfig pour compatibilité
export type ChannelConfig = Channel

export interface ProcessedData {
  date: Date
  level: number
  filteredLevel?: number
  Q_entree: number
  Q_sortie: number
  volumeIndex: number
}

export interface EmailGroup {
  id: number
  emails: string[]
}

export const channels: Channel[] = [
  { id: 2782219, name: "Sidimansour P5" },
  { id: 2792378, name: "FIT Sfax Nord" },
  { id: 2796053, name: "P4_SidiMansour" },
  { id: 2796008, name: "KER_SPE1 " },
  { id: 2785177, name: "Pression refoulement Saline" },
  { id: 2780092, name: "SR4 El Hamma" },
  { id: 2779224, name: "SR2 El Hamma " },
  { id: 2784680, name: "ss" },
  { id: 2784692, name: "RD6 Sidi Mehrez" },
  { id: 2785670, name: "SRT2_Midoune" },
  { id: 2764879, name: "SI_SR3" },
  { id: 2764887, name: "SI_SP3" },
  { id: 2764860, name: "RT_SP2" },
  { id: 2735740, name: "Agareb Souelm" },
  { id: 2767732, name: "SR3_agareb" },
  { id: 2767751, name: "MA_SR2" },
  { id: 2770050, name: "Saline" },
]

export const emailGroups: EmailGroup[] = [
  { id: 1, emails: ["group1@example.com"] },
  { id: 2, emails: ["group2@example.com"] },
  { id: 3, emails: ["group3@example.com"] },
]
