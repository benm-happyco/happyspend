import {
  Accordion,
  Box,
  Button,
  Checkbox,
  Group,
  MultiSelect,
  NumberInput,
  Paper,
  Select,
  Stack,
  Stepper,
  Switch,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core'
import { useMemo, useState } from 'react'
import { useMediaQuery } from '@mantine/hooks'
import { GlobalHeader, GLOBAL_HEADER_HEIGHT } from '../theme/components/GlobalHeader'
import { HpySidebar } from '../theme/components/HpySidebar'
import { HpyPageHeader } from '../theme/components/HpyPageHeader'

type SelectOption = { value: string; label: string }

const portfolioOptions: SelectOption[] = [
  { value: 'capitol-heights', label: 'Capitol Heights' },
  { value: 'pinnacle-living', label: 'Pinnacle Living' },
  { value: 'river-terrace', label: 'River Terrace' },
  { value: 'seaside-commons', label: 'Seaside Commons' },
]

const propertyOptions: SelectOption[] = [
  { value: 'b01', label: 'B01 - Courtyard' },
  { value: 'b02', label: 'B02 - North Tower' },
  { value: 'b03', label: 'B03 - South Tower' },
  { value: 'c12', label: 'C12 - Lakeside' },
  { value: 'd04', label: 'D04 - Hilltop' },
  { value: 'e07', label: 'E07 - River Walk' },
]

export function HappyPropertyOnboarding() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [activeStep, setActiveStep] = useState(0)
  const [searchValue, setSearchValue] = useState('')
  const [portfolioValue, setPortfolioValue] = useState<string | null>(null)
  const [propertyValues, setPropertyValues] = useState<string[]>([])
  const [portfolioName, setPortfolioName] = useState('')
  const [region, setRegion] = useState<string | null>('west')
  const [manager, setManager] = useState('')
  const [timezone, setTimezone] = useState<string | null>('america-los_angeles')
  const [propertyType, setPropertyType] = useState<string | null>('multifamily')
  const [unitCount, setUnitCount] = useState<number | ''>('')
  const [occupancyTarget, setOccupancyTarget] = useState<number | ''>(95)
  const [startDate, setStartDate] = useState('')
  const [dataSources, setDataSources] = useState<string[]>(['work-orders'])
  const [integrations, setIntegrations] = useState<string[]>(['yardi'])
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [billingEmail, setBillingEmail] = useState('')
  const [complianceChecked, setComplianceChecked] = useState(false)
  const [notes, setNotes] = useState('')

  const filteredPortfolios = useMemo(() => {
    if (!searchValue.trim()) return portfolioOptions
    const lowered = searchValue.toLowerCase()
    return portfolioOptions.filter((option) => option.label.toLowerCase().includes(lowered))
  }, [portfolioOptions, searchValue])

  const totalSteps = 4
  const isComplete = activeStep >= totalSteps

  const canContinue = useMemo(() => {
    if (activeStep === 0) return portfolioName.trim().length > 0
    if (activeStep === 1) return propertyValues.length > 0
    if (activeStep === 2) return dataSources.length > 0
    return true
  }, [activeStep, portfolioName, propertyValues, dataSources])

  const steps = [
    {
      label: 'Portfolio',
      description: 'Set portfolio context',
      content: (
        <Stack gap="md">
          <TextInput
            label="Portfolio name"
            placeholder="e.g. Capitol Heights Portfolio"
            value={portfolioName}
            onChange={(event) => setPortfolioName(event.currentTarget.value)}
          />
          <TextInput
            label="Portfolio"
            placeholder="Choose a portfolio"
            value={portfolioValue ?? ''}
            onChange={(event) => setPortfolioValue(event.currentTarget.value || null)}
            list="portfolio-options"
          />
          <datalist id="portfolio-options">
            {filteredPortfolios.map((option) => (
              <option key={option.value} value={option.label} />
            ))}
          </datalist>
          <Group grow>
            <Select
              label="Region"
              placeholder="Select region"
              value={region}
              onChange={setRegion}
              data={[
                { value: 'west', label: 'West' },
                { value: 'midwest', label: 'Midwest' },
                { value: 'south', label: 'South' },
                { value: 'northeast', label: 'Northeast' },
              ]}
            />
            <Select
              label="Primary timezone"
              placeholder="Select timezone"
              value={timezone}
              onChange={setTimezone}
              data={[
                { value: 'america-los_angeles', label: 'Pacific (Los Angeles)' },
                { value: 'america-denver', label: 'Mountain (Denver)' },
                { value: 'america-chicago', label: 'Central (Chicago)' },
                { value: 'america-new_york', label: 'Eastern (New York)' },
              ]}
            />
          </Group>
          <TextInput
            label="Portfolio manager"
            placeholder="Name or email"
            value={manager}
            onChange={(event) => setManager(event.currentTarget.value)}
          />
        </Stack>
      ),
    },
    {
      label: 'Properties',
      description: 'Define scope',
      content: (
        <Stack gap="md">
          <MultiSelect
            label="Properties"
            placeholder="Choose properties to onboard"
            data={propertyOptions}
            value={propertyValues}
            onChange={setPropertyValues}
            searchable
            nothingFoundMessage="No properties available"
          />
          <Group grow>
            <Select
              label="Property type"
              placeholder="Select type"
              value={propertyType}
              onChange={setPropertyType}
              data={[
                { value: 'multifamily', label: 'Multifamily' },
                { value: 'senior', label: 'Senior Living' },
                { value: 'student', label: 'Student Housing' },
                { value: 'single-family', label: 'Single Family' },
              ]}
            />
            <NumberInput
              label="Total units"
              placeholder="Enter unit count"
              value={unitCount}
              onChange={(value) => setUnitCount(value ?? '')}
              min={0}
            />
          </Group>
          <Group grow>
            <NumberInput
              label="Target occupancy (%)"
              placeholder="95"
              value={occupancyTarget}
              onChange={(value) => setOccupancyTarget(value ?? '')}
              min={0}
              max={100}
            />
            <TextInput
              label="Target start date"
              placeholder="MM/DD/YYYY"
              value={startDate}
              onChange={(event) => setStartDate(event.currentTarget.value)}
            />
          </Group>
        </Stack>
      ),
    },
    {
      label: 'Operations',
      description: 'Integrations & policies',
      content: (
        <Stack gap="md">
          <MultiSelect
            label="Data sources"
            placeholder="Select data sources"
            data={[
              { value: 'work-orders', label: 'Work Orders' },
              { value: 'inspections', label: 'Inspections' },
              { value: 'leases', label: 'Leases' },
              { value: 'vendors', label: 'Vendors' },
            ]}
            value={dataSources}
            onChange={setDataSources}
          />
          <MultiSelect
            label="Integrations"
            placeholder="Select integrations"
            data={[
              { value: 'yardi', label: 'Yardi' },
              { value: 'realpage', label: 'RealPage' },
              { value: 'appfolio', label: 'AppFolio' },
              { value: 'entrata', label: 'Entrata' },
            ]}
            value={integrations}
            onChange={setIntegrations}
          />
          <Group grow>
            <TextInput
              label="Billing email"
              placeholder="billing@portfolio.com"
              value={billingEmail}
              onChange={(event) => setBillingEmail(event.currentTarget.value)}
            />
            <Switch
              label="Enable onboarding notifications"
              checked={notificationsEnabled}
              onChange={(event) => setNotificationsEnabled(event.currentTarget.checked)}
              mt={30}
            />
          </Group>
          <Checkbox
            label="I confirm data sources and integrations are ready to connect"
            checked={complianceChecked}
            onChange={(event) => setComplianceChecked(event.currentTarget.checked)}
          />
          <Textarea
            label="Implementation notes"
            placeholder="Share any constraints, timelines, or stakeholders"
            minRows={3}
            value={notes}
            onChange={(event) => setNotes(event.currentTarget.value)}
          />
        </Stack>
      ),
    },
    {
      label: 'Review',
      description: 'Confirm details',
      content: (
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Review the onboarding scope before starting the workflow.
          </Text>
          <Text size="sm">Portfolio: {portfolioName || 'Not set'}</Text>
          <Text size="sm">Region: {region ?? 'Not set'}</Text>
          <Text size="sm">Manager: {manager || 'Not set'}</Text>
          <Text size="sm">Timezone: {timezone ?? 'Not set'}</Text>
          <Text size="sm">Properties: {propertyValues.length > 0 ? propertyValues.join(', ') : 'None selected'}</Text>
          <Text size="sm">Property type: {propertyType ?? 'Not set'}</Text>
          <Text size="sm">Unit count: {unitCount || 'Not set'}</Text>
          <Text size="sm">Target occupancy: {occupancyTarget || 'Not set'}%</Text>
          <Text size="sm">Start date: {startDate || 'Not set'}</Text>
          <Text size="sm">Data sources: {dataSources.join(', ')}</Text>
          <Text size="sm">Integrations: {integrations.join(', ')}</Text>
          <Text size="sm">Billing email: {billingEmail || 'Not set'}</Text>
          <Text size="sm">Notes: {notes || 'None'}</Text>
        </Stack>
      ),
    },
  ]

  return (
    <>
      <GlobalHeader variant="product" />
      <Box
        style={{
          paddingTop: GLOBAL_HEADER_HEIGHT,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'stretch',
        }}
      >
        <HpySidebar height={`calc(100vh - ${GLOBAL_HEADER_HEIGHT}px)`} />
        <Box style={{ flex: 1, padding: 56, display: 'flex', flexDirection: 'column' }}>
          <Stack gap="xl" style={{ flex: 1, minHeight: 0 }}>
            <HpyPageHeader
              title="Portfolio Onboarding"
              appIconType="Projects"
              searchPlaceholder="Search portfolios"
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              ctaLabel="Start Onboarding"
            />
          </Stack>
        </Box>
      </Box>
      {!isComplete && (
        <Box
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 5000,
            backgroundColor: 'rgba(59, 55, 153, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 56,
          }}
        >
          <Paper withBorder radius="md" p="xl" style={{ width: 'min(900px, 100%)', maxHeight: 'calc(100vh - 112px)', overflowY: 'auto' }}>
            <Stack gap="xl">
              {isMobile ? (
                <>
                  <Accordion value={String(activeStep)} onChange={(value) => setActiveStep(Number(value))}>
                    {steps.map((step, index) => (
                      <Accordion.Item key={step.label} value={String(index)}>
                        <Accordion.Control>
                          Step {index + 1}: {step.label}
                        </Accordion.Control>
                        <Accordion.Panel>{step.content}</Accordion.Panel>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                  {isComplete && (
                    <Stack gap="sm" mt="md">
                      <Text size="sm">Onboarding setup complete.</Text>
                      <Text size="sm" c="dimmed">
                        You can now exit the wizard and continue configuring the portfolio.
                      </Text>
                    </Stack>
                  )}
                </>
              ) : (
                <Stepper active={activeStep} onStepClick={setActiveStep} allowNextStepsSelect={false}>
                  {steps.map((step) => (
                    <Stepper.Step key={step.label} label={step.label} description={step.description}>
                      {step.content}
                    </Stepper.Step>
                  ))}
                  <Stepper.Completed>
                    <Stack gap="sm">
                      <Text size="sm">Onboarding setup complete.</Text>
                      <Text size="sm" c="dimmed">
                        You can now exit the wizard and continue configuring the portfolio.
                      </Text>
                    </Stack>
                  </Stepper.Completed>
                </Stepper>
              )}
              <Group justify="space-between">
                <Button variant="outline" color="gray" onClick={() => setActiveStep((step) => Math.max(step - 1, 0))}>
                  Back
                </Button>
                <Button
                  variant="filled"
                  color="blurple"
                  onClick={() => setActiveStep((step) => Math.min(step + 1, totalSteps))}
                  disabled={!canContinue}
                >
                  {activeStep >= totalSteps - 1 ? 'Finish' : 'Continue'}
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Box>
      )}
    </>
  )
}
