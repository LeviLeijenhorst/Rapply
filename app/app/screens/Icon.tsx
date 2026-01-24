import React from "react"
import People from "./svgs/People"
import Microphone from "./svgs/Microphone"
import Settings from "./svgs/Settings"
import Search from "./svgs/Search"
import Plus from "./svgs/Plus"
import Back from "./svgs/Back"
import CloseCircle from "./svgs/CloseCircle"
import Pause from "./svgs/Pause"
import Stop from "./svgs/Stop"
import Close from "./svgs/Close"
import Play from "./svgs/Play"
import ChevronDown from "./svgs/ChevronDown"
import ChevronRight from "./svgs/ChevronRight"
import PersonAdd from "./svgs/PersonAdd"
import ChevronUp from "./svgs/ChevronUp"
import More from "./svgs/More"
import DocumentEdit from "./svgs/DocumentEdit"
import MicrophoneSmall from "./svgs/MicrophoneSmall"
import AddAudio from "./svgs/AddAudio"
import Trash from "./svgs/Trash"
import UserEdit from "./svgs/UserEdit"
import ConversationsSelect from "./svgs/ConversationsSelect"
import UserMinus from "./svgs/UserMinus"
import ProfileCircle from "./svgs/ProfileCircle"
import Email from "./svgs/Email"
import Internet from "./svgs/Internet"
import Location from "./svgs/Location"
import Logout from "./svgs/Logout"
import Send from "./svgs/Send"
import Export from "./svgs/Export"
import Backward10 from "./svgs/Backward10"
import Forward10 from "./svgs/Forward10"
import EditPen from "./svgs/EditPen"
import EditSmall from "./svgs/EditSmall"
import SharePdf from "./svgs/SharePdf"
import ShareAudio from "./svgs/ShareAudio"
import ShareTranscript from "./svgs/ShareTranscript"
import AddCoacheeFilled from "./svgs/AddCoacheeFilled"
import { colors } from "./constants"

export type IconName =
  | "people"
  | "microphone"
  | "settings"
  | "search"
  | "plus"
  | "back"
  | "closeCircle"
  | "pause"
  | "stop"
  | "close"
  | "play"
  | "chevronDown"
  | "chevronRight"
  | "personAdd"
  | "chevronUp"
  | "more"
  | "documentEdit"
  | "microphoneSmall"
  | "addAudio"
  | "addCoacheeFilled"
  | "trash"
  | "userEdit"
  | "conversationsSelect"
  | "userMinus"
  | "profileCircle"
  | "email"
  | "internet"
  | "location"
  | "logout"
  | "send"
  | "export"
  | "backward10"
  | "forward10"
  | "editPen"
  | "editSmall"
  | "sharePdf"
  | "shareAudio"
  | "shareTranscript"

export function Icon({ name, color, size }: { name: IconName; color?: string; size?: number }) {
  const resolvedColor = color ?? colors.textPrimary
  switch (name) {
    case "people":
      return <People color={resolvedColor} size={size} />
    case "microphone":
      return <Microphone color={resolvedColor} size={size} />
    case "settings":
      return <Settings color={resolvedColor} size={size} />
    case "search":
      return <Search color={resolvedColor} size={size} />
    case "plus":
      return <Plus color={resolvedColor} size={size} />
    case "back":
      return <Back color={resolvedColor} size={size} />
    case "closeCircle":
      return <CloseCircle color={resolvedColor} size={size} />
    case "pause":
      return <Pause color={resolvedColor} size={size} />
    case "stop":
      return <Stop color={resolvedColor} size={size} />
    case "close":
      return <Close color={resolvedColor} size={size} />
    case "play":
      return <Play color={resolvedColor} size={size} />
    case "chevronDown":
      return <ChevronDown color={resolvedColor} size={size} />
    case "chevronRight":
      return <ChevronRight color={resolvedColor} size={size} />
    case "personAdd":
      return <PersonAdd color={resolvedColor} size={size} />
    case "chevronUp":
      return <ChevronUp color={resolvedColor} size={size} />
    case "more":
      return <More color={resolvedColor} size={size} />
    case "documentEdit":
      return <DocumentEdit color={resolvedColor} size={size} />
    case "microphoneSmall":
      return <MicrophoneSmall color={resolvedColor} size={size} />
    case "addAudio":
      return <AddAudio color={resolvedColor} size={size} />
    case "addCoacheeFilled":
      return <AddCoacheeFilled color={resolvedColor} size={size} />
    case "trash":
      return <Trash color={resolvedColor} size={size} />
    case "userEdit":
      return <UserEdit color={resolvedColor} size={size} />
    case "conversationsSelect":
      return <ConversationsSelect color={resolvedColor} size={size} />
    case "userMinus":
      return <UserMinus color={resolvedColor} size={size} />
    case "profileCircle":
      return <ProfileCircle color={resolvedColor} size={size} />
    case "email":
      return <Email color={resolvedColor} size={size} />
    case "internet":
      return <Internet color={resolvedColor} size={size} />
    case "location":
      return <Location color={resolvedColor} size={size} />
    case "logout":
      return <Logout color={resolvedColor} size={size} />
    case "send":
      return <Send color={resolvedColor} size={size} />
    case "export":
      return <Export color={resolvedColor} size={size} />
    case "backward10":
      return <Backward10 color={resolvedColor} size={size} />
    case "forward10":
      return <Forward10 color={resolvedColor} size={size} />
    case "editPen":
      return <EditPen color={resolvedColor} size={size} />
    case "editSmall":
      return <EditSmall color={resolvedColor} size={size} />
    case "sharePdf":
      return <SharePdf color={resolvedColor} size={size} />
    case "shareAudio":
      return <ShareAudio color={resolvedColor} size={size} />
    case "shareTranscript":
      return <ShareTranscript color={resolvedColor} size={size} />
    default:
      return null
  }
}
