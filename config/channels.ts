export interface Channel {
  id: number
  name: string
  surface?: number
  enableFlowCalculation: boolean
  nthThreshold?: number
  ntbThreshold?: number
  overflowThreshold?: number
  emailGroup?: number
  enableFiltering?: boolean
  filterWindowSize?: number
  usePumpFlow?: boolean
  pumps?: {
    id: number
    flowRate: number
  }[]
}

export interface EmailGroup {
  id: number
  emails: string[]
}

export interface ProcessedData {
  date: Date
  level: number
  filteredLevel?: number
  Q_entree: number
  Q_sortie: number
  volumeIndex: number
}

export type ChannelConfig = Channel

export const channels: Channel[] = [
  { id: 2791635, name: "SPTR Ajim", enableFlowCalculation: false, nthThreshold: 3.2, ntbThreshold: 1.5, emailGroup: 1 },
  { id: 2791703, name: "MI_SRT3", enableFlowCalculation: false, emailGroup: 1 },
  { id: 2792378, name: "Med_SPTR", enableFlowCalculation: false, emailGroup: 1 },
  { id: 2791830, name: "SP4 Houmet Souk", enableFlowCalculation: false, emailGroup: 1 },
  //{ id: 2784626, name: "MI_SRJ4", enableFlowCalculation: false, emailGroup: 1 },
  { id: 2783757, name: "SR3 midou", enableFlowCalculation: false, emailGroup: 1 },
  { id: 2796053, name: "SP3 Houmet Souk", enableFlowCalculation: false, emailGroup: 1 },
  { id: 2783936, name: "SRT5 Midoune", enableFlowCalculation: false, emailGroup: 1 },
  { id: 2782228, name: "Midpun_SRJ2", enableFlowCalculation: false, emailGroup: 1 },
  {
    id: 2780154,
    name: "GA_SR9",
    surface: 12.75,
    enableFlowCalculation: true,
    emailGroup: 2,
    enableFiltering: true,
    filterWindowSize: 2,
  },
  {
    id: 2781182,
    name: "GA_SR4",
    surface: 19.6,
    enableFlowCalculation: true,
    emailGroup: 2,
    enableFiltering: true,
    filterWindowSize: 5,
  },
  {
    id: 2784626,
    name: "SR4 Gabes",
    surface: 19.6,
    enableFlowCalculation: true,
    emailGroup: 2,
    usePumpFlow: true,
    pumps: [
      { id: 1, flowRate: 200 },
      { id: 2, flowRate: 150 },
    ],
  },
  {
    id: 2779959,
    name: "GA_SP2",
    surface: 8.5,
    enableFlowCalculation: true,
    enableFiltering: true,
    filterWindowSize: 3,
    emailGroup: 2,
  },
  { id: 2782219, name: "SP1 Zarat", surface: 8.1, enableFlowCalculation: true, emailGroup: 2 },
  { id: 2780092, name: "SR4 El Hamma", surface: 13.5, enableFlowCalculation: true, emailGroup: 2 },
  { id: 2779224, name: "SR2 El Hamma ", surface: 13.5, enableFlowCalculation: true, emailGroup: 2 },
  { id: 2796008, name: "KER_SPE1 ", surface: 7.1, enableFlowCalculation: true, emailGroup: 2 },
  { id: 2784680, name: "ss", enableFlowCalculation: false, emailGroup: 1 },
  { id: 2784692, name: "RD6 Sidi Mehrez", enableFlowCalculation: false, emailGroup: 1 },
  { id: 2785670, name: "SRT2_Midoune", enableFlowCalculation: false, emailGroup: 1 },
  { id: 2785177, name: "RD4 Sidi Mehrez", enableFlowCalculation: false, emailGroup: 1 },
  { id: 2764879, name: "SI_SR3", surface: 12.5, enableFlowCalculation: true, emailGroup: 3 },
  { id: 2764887, name: "SI_SP3", surface: 28.5, enableFlowCalculation: true, emailGroup: 3 },
  {
    id: 2764860,
    name: "RT_SP2",
    surface: 10.5,
    enableFiltering: true,
    filterWindowSize: 15,
    enableFlowCalculation: true,
    emailGroup: 3,
  },
  {
    id: 2735740,
    name: "Agareb Souelm",
    surface: 20.5,
    enableFiltering: true,
    filterWindowSize: 15,
    enableFlowCalculation: true,
    emailGroup: 3,
  },
  {
    id: 2767732,
    name: "SR3_agareb",
    surface: 20.5,
    enableFiltering: true,
    enableFlowCalculation: true,
    filterWindowSize: 10,
    emailGroup: 3,
  },
  {
    id: 2767751,
    name: "MA_SR2",
    surface: 20.5,
    enableFiltering: true,
    enableFlowCalculation: true,
    filterWindowSize: 2,
    emailGroup: 3,
  },
  { id: 2770050, name: "Saline", surface: 25.5, enableFlowCalculation: true, emailGroup: 3 },
]

export const emailGroups: EmailGroup[] = [
  { id: 1, emails: ["group1@example.com"] },
  { id: 2, emails: ["group2@example.com"] },
  { id: 3, emails: ["group3@example.com"] },
]
