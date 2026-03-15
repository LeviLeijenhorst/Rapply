import React from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

import { colors } from '../../../design/theme/colors'
import { typography } from '../../../design/theme/typography'
import { Text } from '../../../ui/Text'
import { SidebarItem } from './SidebarItem'
import { ProfileCircleIcon } from '../../../icons/ProfileCircleIcon'

export type SidebarItemKey = 'clients' | 'dashboard' | 'reports' | 'mijnPraktijk' | 'archief' | 'admin' | 'adminContact' | 'adminWachtlijst'

type AnchorPoint = { x: number; y: number }

type Props = {
  selectedSidebarItemKey: SidebarItemKey
  isSettingsSelected: boolean
  isAdminUser?: boolean
  usedMinutes?: number
  totalMinutes?: number
  userName?: string | null
  userRole?: string
  onSelectSidebarItem: (sidebarItemKey: SidebarItemKey) => void
  onOpenSettingsMenu: (anchorPoint: AnchorPoint) => void
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function Sidebar({
  selectedSidebarItemKey,
  isSettingsSelected,
  isAdminUser = false,
  usedMinutes = 0,
  totalMinutes = 0,
  userName,
  userRole = 'Re-integratiecoach',
  onSelectSidebarItem,
  onOpenSettingsMenu,
}: Props) {
  const { width } = useWindowDimensions()
  const isCompact = width < 700

  const ratio = totalMinutes > 0 ? clamp(usedMinutes / totalMinutes, 0, 1) : 0
  const progressWidth = Math.round(192 * ratio)
  const displayName = userName || 'Peter Dalman'

  function getMenuAnchorPoint(event: any): AnchorPoint {
    const rectFromCurrentTarget = event?.currentTarget?.getBoundingClientRect?.()
    const rectFromNativeTarget = event?.nativeEvent?.target?.getBoundingClientRect?.()
    const rect = rectFromCurrentTarget ?? rectFromNativeTarget

    const clientX = event?.nativeEvent?.clientX
    const clientY = event?.nativeEvent?.clientY
    const pageX = event?.nativeEvent?.pageX
    const pageY = event?.nativeEvent?.pageY

    return {
      x: rect ? rect.left : typeof clientX === 'number' ? clientX : typeof pageX === 'number' ? pageX : 0,
      y: rect ? rect.top : typeof clientY === 'number' ? clientY : typeof pageY === 'number' ? pageY : 0,
    }
  }

  if (isCompact) {
    return (
      <View style={[styles.container, styles.containerCompact]}>
        <View style={styles.menuItemsCompact}>
          <SidebarItem
            label="Dashboard"
            isSelected={selectedSidebarItemKey === 'dashboard'}
            onPress={() => onSelectSidebarItem('dashboard')}
            icon={<HomeIcon color={selectedSidebarItemKey === 'dashboard' ? '#BE0165' : '#2C111F'} />}
            isCompact
          />
          <SidebarItem
            label="Clienten"
            isSelected={selectedSidebarItemKey === 'clients'}
            onPress={() => onSelectSidebarItem('clients')}
            icon={<PeopleIcon color={selectedSidebarItemKey === 'clients' ? '#BE0165' : '#2C111F'} />}
            isCompact
          />
          <SidebarItem
            label="Rapportages"
            isSelected={selectedSidebarItemKey === 'reports'}
            onPress={() => onSelectSidebarItem('reports')}
            icon={<DocumentIcon color={selectedSidebarItemKey === 'reports' ? '#BE0165' : '#2C111F'} />}
            isCompact
          />
          <SidebarItem
            label="Mijn organisatie"
            isSelected={selectedSidebarItemKey === 'mijnPraktijk'}
            onPress={() => onSelectSidebarItem('mijnPraktijk')}
            icon={<BriefcaseIcon color={selectedSidebarItemKey === 'mijnPraktijk' ? '#BE0165' : '#2C111F'} />}
            isCompact
          />
          <SidebarItem
            label="Instellingen"
            isSelected={isSettingsSelected}
            onPress={(event) => onOpenSettingsMenu(getMenuAnchorPoint(event))}
            icon={<Setting2Icon color={isSettingsSelected ? '#BE0165' : '#2C111F'} />}
            isCompact
          />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.menuItems}>
          <SidebarItem
            label="Dashboard"
            isSelected={selectedSidebarItemKey === 'dashboard'}
            onPress={() => onSelectSidebarItem('dashboard')}
            icon={<HomeIcon color={selectedSidebarItemKey === 'dashboard' ? '#BE0165' : '#2C111F'} />}
          />
          <SidebarItem
            label="Clienten"
            isSelected={selectedSidebarItemKey === 'clients'}
            onPress={() => onSelectSidebarItem('clients')}
            icon={<PeopleIcon color={selectedSidebarItemKey === 'clients' ? '#BE0165' : '#2C111F'} />}
          />
          <SidebarItem
            label="Rapportages"
            isSelected={selectedSidebarItemKey === 'reports'}
            onPress={() => onSelectSidebarItem('reports')}
            icon={<DocumentIcon color={selectedSidebarItemKey === 'reports' ? '#BE0165' : '#2C111F'} />}
          />
          <SidebarItem
            label="Meldingen"
            isSelected={false}
            onPress={() => undefined}
            icon={<NotificationIcon color="#2C111F" />}
          />
          {isAdminUser ? (
            <SidebarItem
              label="Admin"
              isSelected={selectedSidebarItemKey === 'admin'}
              onPress={() => onSelectSidebarItem('admin')}
              icon={<NotificationIcon color={selectedSidebarItemKey === 'admin' ? '#BE0165' : '#2C111F'} />}
            />
          ) : null}
          {isAdminUser ? (
            <SidebarItem
              label="Contactberichten"
              isSelected={selectedSidebarItemKey === 'adminContact'}
              onPress={() => onSelectSidebarItem('adminContact')}
              icon={<NotificationIcon color={selectedSidebarItemKey === 'adminContact' ? '#BE0165' : '#2C111F'} />}
            />
          ) : null}
          {isAdminUser ? (
            <SidebarItem
              label="Wachtlijst"
              isSelected={selectedSidebarItemKey === 'adminWachtlijst'}
              onPress={() => onSelectSidebarItem('adminWachtlijst')}
              icon={<NotificationIcon color={selectedSidebarItemKey === 'adminWachtlijst' ? '#BE0165' : '#2C111F'} />}
            />
          ) : null}
        </View>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.menuItems}>
          <SidebarItem
            label="Mijn organisatie"
            isSelected={selectedSidebarItemKey === 'mijnPraktijk'}
            onPress={() => onSelectSidebarItem('mijnPraktijk')}
            icon={<BriefcaseIcon color={selectedSidebarItemKey === 'mijnPraktijk' ? '#BE0165' : '#2C111F'} />}
          />
          <SidebarItem
            label="Instellingen"
            isSelected={isSettingsSelected}
            onPress={(event) => onOpenSettingsMenu(getMenuAnchorPoint(event))}
            icon={<Setting2Icon color={isSettingsSelected ? '#BE0165' : '#2C111F'} />}
          />
        </View>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <ProfileCircleIcon size={28} />
          </View>
          <View style={styles.profileText}>
            <Text isSemibold style={styles.profileName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text isSemibold style={styles.profileRole} numberOfLines={1}>
              {userRole}
            </Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        <Text style={styles.usageText}>{`${usedMinutes} van de ${totalMinutes} minuten`}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 256,
    backgroundColor: '#FEFEFE',
    borderRightWidth: 1,
    borderRightColor: colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    shadowOpacity: 0.04,
    ...( { boxShadow: '0 2px 8px rgba(0,0,0,0.04)' } as any ),
    paddingTop: 32,
    justifyContent: 'flex-start',
  },
  containerCompact: {
    width: 72,
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  menuItemsCompact: {
    gap: 8,
  },
  topSection: {
    paddingHorizontal: 16,
    flex: 1,
  },
  menuItems: {
    gap: 3,
  },
  bottomSection: {
    paddingHorizontal: 16,
    marginTop: 'auto',
    marginBottom: 6,
  },
  profileSection: {
    borderTopWidth: 1,
    borderTopColor: '#D9D9D9',
    paddingHorizontal: 32,
    paddingTop: 16,
    paddingBottom: 20,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DADBDD',
    backgroundColor: '#F6F6F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileText: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    fontSize: 16,
    lineHeight: 20,
    color: '#2C111F',
    fontFamily: typography.fontFamilySemibold,
  },
  profileRole: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(44,17,31,0.5)',
    fontFamily: typography.fontFamilySemibold,
  },
  progressTrack: {
    width: 192,
    height: 4,
    borderRadius: 8,
    backgroundColor: '#D9D9D9',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#BE0165',
  },
  usageText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(44,17,31,0.5)',
  },
})

type SidebarIconProps = { color: string }

function HomeIcon({ color }: SidebarIconProps) {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Path d="M15.03 5.115L10.71 2.0925C9.5325 1.2675 7.725 1.3125 6.5925 2.19L2.835 5.1225C2.085 5.7075 1.4925 6.9075 1.4925 7.8525V13.0275C1.4925 14.94 3.045 16.5 4.9575 16.5H13.0425C14.955 16.5 16.5075 14.9475 16.5075 13.035V7.95C16.5075 6.9375 15.855 5.6925 15.03 5.115ZM9.5625 13.5C9.5625 13.8075 9.3075 14.0625 9 14.0625C8.6925 14.0625 8.4375 13.8075 8.4375 13.5V11.25C8.4375 10.9425 8.6925 10.6875 9 10.6875C9.3075 10.6875 9.5625 10.9425 9.5625 11.25V13.5Z" fill={color} />
    </Svg>
  )
}

function PeopleIcon({ color }: SidebarIconProps) {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Path d="M13.1475 5.8275C13.095 5.82 13.0425 5.82 12.99 5.8275C11.8275 5.79 10.905 4.8375 10.905 3.6675C10.905 2.475 11.8725 1.5 13.0725 1.5C14.265 1.5 15.24 2.4675 15.24 3.6675C15.2325 4.8375 14.31 5.79 13.1475 5.8275Z" fill={color} />
      <Path d="M15.5925 11.025C14.7525 11.5875 13.575 11.7975 12.4875 11.655C12.7725 11.04 12.9225 10.3575 12.93 9.6375C12.93 8.8875 12.765 8.175 12.45 7.5525C13.56 7.4025 14.7375 7.6125 15.585 8.175C16.77 8.955 16.77 10.2375 15.5925 11.025Z" fill={color} />
      <Path d="M4.83 5.8275C4.8825 5.82 4.935 5.82 4.9875 5.8275C6.15 5.79 7.0725 4.8375 7.0725 3.6675C7.0725 2.4675 6.105 1.5 4.905 1.5C3.7125 1.5 2.745 2.4675 2.745 3.6675C2.745 4.8375 3.6675 5.79 4.83 5.8275Z" fill={color} />
      <Path d="M4.9125 9.6375C4.9125 10.365 5.07 11.055 5.355 11.6775C4.2975 11.79 3.195 11.565 2.385 11.0325C1.2 10.245 1.2 8.9625 2.385 8.175C3.1875 7.635 4.32 7.4175 5.385 7.5375C5.0775 8.1675 4.9125 8.88 4.9125 9.6375Z" fill={color} />
      <Path d="M9.09 11.9025C9.03 11.895 8.9625 11.895 8.895 11.9025C7.515 11.8575 6.4125 10.725 6.4125 9.33C6.42 7.905 7.5675 6.75 9 6.75C10.425 6.75 11.58 7.905 11.58 9.33C11.5725 10.725 10.4775 11.8575 9.09 11.9025Z" fill={color} />
      <Path d="M6.6525 13.455C5.52 14.2125 5.52 15.4575 6.6525 16.2075C7.9425 17.07 10.0575 17.07 11.3475 16.2075C12.48 15.45 12.48 14.205 11.3475 13.455C10.065 12.5925 7.95 12.5925 6.6525 13.455Z" fill={color} />
    </Svg>
  )
}

function DocumentIcon({ color }: SidebarIconProps) {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Path d="M12 1.5H6C3.375 1.5 2.25 3 2.25 5.25V12.75C2.25 15 3.375 16.5 6 16.5H12C14.625 16.5 15.75 15 15.75 12.75V5.25C15.75 3 14.625 1.5 12 1.5ZM6 9.1875H9C9.3075 9.1875 9.5625 9.4425 9.5625 9.75C9.5625 10.0575 9.3075 10.3125 9 10.3125H6C5.6925 10.3125 5.4375 10.0575 5.4375 9.75C5.4375 9.4425 5.6925 9.1875 6 9.1875ZM12 13.3125H6C5.6925 13.3125 5.4375 13.0575 5.4375 12.75C5.4375 12.4425 5.6925 12.1875 6 12.1875H12C12.3075 12.1875 12.5625 12.4425 12.5625 12.75C12.5625 13.0575 12.3075 13.3125 12 13.3125ZM13.875 6.9375H12.375C11.235 6.9375 10.3125 6.015 10.3125 4.875V3.375C10.3125 3.0675 10.5675 2.8125 10.875 2.8125C11.1825 2.8125 11.4375 3.0675 11.4375 3.375V4.875C11.4375 5.3925 11.8575 5.8125 12.375 5.8125H13.875C14.1825 5.8125 14.4375 6.0675 14.4375 6.375C14.4375 6.6825 14.1825 6.9375 13.875 6.9375Z" fill={color} />
    </Svg>
  )
}

function BriefcaseIcon({ color }: SidebarIconProps) {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Path d="M15.8175 5.235C15.18 4.53 14.115 4.1775 12.57 4.1775H12.39V4.1475C12.39 2.8875 12.39 1.3275 9.57 1.3275H8.43C5.61 1.3275 5.61 2.895 5.61 4.1475V4.185H5.43C3.8775 4.185 2.82 4.5375 2.1825 5.2425C1.44 6.0675 1.4625 7.1775 1.5375 7.935L1.545 7.9875L1.59746 8.53828C1.61172 8.68806 1.69244 8.82344 1.81851 8.90556C2.00029 9.02396 2.26535 9.19353 2.43 9.285C2.535 9.3525 2.6475 9.4125 2.76 9.4725C4.0425 10.1775 5.4525 10.65 6.885 10.8825C6.9525 11.5875 7.26 12.4125 8.9025 12.4125C10.545 12.4125 10.8675 11.595 10.92 10.8675C12.45 10.62 13.9275 10.0875 15.2625 9.3075C15.3075 9.285 15.3375 9.2625 15.375 9.24C15.657 9.08063 15.949 8.88619 16.2182 8.69353C16.3315 8.61243 16.4038 8.48625 16.4191 8.34774L16.425 8.295L16.4625 7.9425C16.47 7.8975 16.47 7.86 16.4775 7.8075C16.5375 7.05 16.5225 6.015 15.8175 5.235ZM9.8175 10.3725C9.8175 11.1675 9.8175 11.2875 8.895 11.2875C7.9725 11.2875 7.9725 11.145 7.9725 10.38V9.435H9.8175V10.3725ZM6.6825 4.1775V4.1475C6.6825 2.8725 6.6825 2.4 8.43 2.4H9.57C11.3175 2.4 11.3175 2.88 11.3175 4.1475V4.185H6.6825V4.1775Z" fill={color} />
      <Path d="M15.4532 10.3962C15.8076 10.2294 16.2143 10.5104 16.1789 10.9004L15.93 13.6425C15.7725 15.1425 15.1575 16.6725 11.8575 16.6725H6.1425C2.8425 16.6725 2.2275 15.1425 2.07 13.65L1.83429 11.0572C1.79925 10.6717 2.19699 10.3912 2.55028 10.5493C3.41229 10.935 4.78562 11.5216 5.69054 11.7696C5.85436 11.8145 5.98795 11.9329 6.06399 12.0848C6.53163 13.0187 7.5071 13.515 8.9025 13.515C10.2842 13.515 11.2713 12.9996 11.7408 12.0625C11.817 11.9105 11.9504 11.7922 12.1143 11.747C13.0777 11.4812 14.5471 10.8225 15.4532 10.3962Z" fill={color} />
    </Svg>
  )
}

function Setting2Icon({ color }: SidebarIconProps) {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Path d="M15.075 6.91505C13.7175 6.91505 13.1625 5.95505 13.8375 4.77755C14.2275 4.09505 13.995 3.22505 13.3125 2.83505L12.015 2.09255C11.4225 1.74005 10.6575 1.95005 10.305 2.54255L10.2225 2.68505C9.5475 3.86255 8.4375 3.86255 7.755 2.68505L7.6725 2.54255C7.335 1.95005 6.57 1.74005 5.9775 2.09255L4.68 2.83505C3.9975 3.22505 3.765 4.10255 4.155 4.78505C4.8375 5.95505 4.2825 6.91505 2.925 6.91505C2.145 6.91505 1.5 7.55255 1.5 8.34005V9.66005C1.5 10.44 2.1375 11.085 2.925 11.085C4.2825 11.085 4.8375 12.045 4.155 13.2225C3.765 13.905 3.9975 14.775 4.68 15.165L5.9775 15.9075C6.57 16.26 7.335 16.05 7.6875 15.4575L7.77 15.315C8.445 14.1375 9.555 14.1375 10.2375 15.315L10.32 15.4575C10.6725 16.05 11.4375 16.26 12.03 15.9075L13.3275 15.165C14.01 14.775 14.2425 13.8975 13.8525 13.2225C13.17 12.045 13.725 11.085 15.0825 11.085C15.8625 11.085 16.5075 10.4475 16.5075 9.66005V8.34005C16.5 7.56005 15.8625 6.91505 15.075 6.91505ZM9 11.4375C7.6575 11.4375 6.5625 10.3425 6.5625 9.00005C6.5625 7.65755 7.6575 6.56255 9 6.56255C10.3425 6.56255 11.4375 7.65755 11.4375 9.00005C11.4375 10.3425 10.3425 11.4375 9 11.4375Z" fill={color} />
    </Svg>
  )
}

function NotificationIcon({ color }: SidebarIconProps) {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Path d="M14.505 10.8675L13.755 9.6225C13.5975 9.345 13.455 8.82 13.455 8.5125V6.615C13.455 4.8525 12.42 3.33 10.9275 2.6175C10.5375 1.9275 9.8175 1.5 8.9925 1.5C8.175 1.5 7.44 1.9425 7.05 2.64C5.5875 3.3675 4.575 4.875 4.575 6.615V8.5125C4.575 8.82 4.4325 9.345 4.275 9.615L3.5175 10.8675C3.2175 11.37 3.15 11.925 3.3375 12.435C3.5175 12.9375 3.945 13.3275 4.5 13.515C5.955 14.01 7.485 14.25 9.015 14.25C10.545 14.25 12.075 14.01 13.53 13.5225C14.055 13.35 14.46 12.9525 14.655 12.435C14.85 11.9175 14.7975 11.3475 14.505 10.8675Z" fill={color} />
      <Path d="M11.1225 15.0075C10.8075 15.8775 9.975 16.5 9 16.5C8.4075 16.5 7.8225 16.26 7.41 15.8325C7.17 15.6075 6.99 15.3075 6.885 15C6.9825 15.015 7.08 15.0225 7.185 15.0375C7.3575 15.06 7.5375 15.0825 7.7175 15.0975C8.145 15.135 8.58 15.1575 9.015 15.1575C9.4425 15.1575 9.87 15.135 10.29 15.0975C10.4475 15.0825 10.605 15.075 10.755 15.0525C10.875 15.0375 10.995 15.0225 11.1225 15.0075Z" fill={color} />
    </Svg>
  )
}


