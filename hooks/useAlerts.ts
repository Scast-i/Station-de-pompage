import { useState, useEffect } from "react"
import type { Channel, EmailGroup } from "@/config/channels"
import { sendEmail } from "@/services/emailService"

interface AlertState {
  isNTH: boolean
  isNTB: boolean
  isOverflowing: boolean
  overflowCount: number
  overflowDuration: number
}

export function useAlerts(channel: Channel, currentLevel: number | null, emailGroups: EmailGroup[]) {
  const [alertState, setAlertState] = useState<AlertState>({
    isNTH: false,
    isNTB: false,
    isOverflowing: false,
    overflowCount: 0,
    overflowDuration: 0,
  })

  useEffect(() => {
    if (currentLevel === null || !channel.nthThreshold || !channel.ntbThreshold || !channel.overflowThreshold) {
      return
    }

    const newState = { ...alertState }

    // Check NTH
    if (currentLevel > channel.nthThreshold && !newState.isNTH) {
      newState.isNTH = true
      sendAlert("NTH", channel, currentLevel, emailGroups)
    } else if (currentLevel <= channel.nthThreshold) {
      newState.isNTH = false
    }

    // Check NTB
    if (currentLevel < channel.ntbThreshold && !newState.isNTB) {
      newState.isNTB = true
      sendAlert("NTB", channel, currentLevel, emailGroups)
    } else if (currentLevel >= channel.ntbThreshold) {
      newState.isNTB = false
    }

    // Check Overflow
    if (currentLevel > channel.overflowThreshold && !newState.isOverflowing) {
      newState.isOverflowing = true
      newState.overflowCount++
      sendAlert("Overflow", channel, currentLevel, emailGroups)
    } else if (currentLevel <= channel.overflowThreshold && newState.isOverflowing) {
      newState.isOverflowing = false
    }

    // Update overflow duration
    if (newState.isOverflowing) {
      newState.overflowDuration += 2 // Increment by 2 minutes since we're fetching every 2 minutes
    }

    setAlertState(newState)
  }, [channel, currentLevel, alertState, emailGroups])

  return alertState
}

async function sendAlert(
  type: "NTH" | "NTB" | "Overflow",
  channel: Channel,
  currentLevel: number,
  emailGroups: EmailGroup[],
) {
  const emailGroup = emailGroups.find((group) => group.id === channel.emailGroup)
  const emailAddresses = emailGroup ? emailGroup.emails : []

  let subject, text
  switch (type) {
    case "NTH":
      subject = `Alerte NTH pour ${channel.name}`
      text = `Le niveau est très haut pour le canal ${channel.name}. Valeur actuelle : ${currentLevel}`
      break
    case "NTB":
      subject = `Alerte NTB pour ${channel.name}`
      text = `Le niveau est très bas pour le canal ${channel.name}. Valeur actuelle : ${currentLevel}`
      break
    case "Overflow":
      subject = `Alerte de débordement pour ${channel.name}`
      text = `Un débordement a été détecté pour le canal ${channel.name}. Valeur actuelle : ${currentLevel}`
      break
  }

  const success = await sendEmail(emailAddresses, subject, text)
  if (success) {
    console.log(`Alerte ${type} envoyée pour ${channel.name}`)
  } else {
    console.error(`Échec de l'envoi de l'alerte ${type} pour ${channel.name}`)
  }
}
