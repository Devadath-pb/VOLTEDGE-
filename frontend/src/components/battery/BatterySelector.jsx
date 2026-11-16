import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Battery, Check, ChevronDown, Loader2, Plus, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useApp } from '../../context/AppContext.jsx'

const emptyForm = {
  serial_number: '',
  manufacturer: '',
  model: '',
  chemistry: 'Li-ion',
  rated_capacity_mah: '3600',
  nominal_voltage: '3.7',
  manufacture_date: '',
  purchase_date: '',
  installation_date: '',
}

function Field({ label, name, form, setForm, required = false, type = 'text', step }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">{label}{required && ' *'}</span>
      <input
        className="input-glass"
        name={name}
        type={type}
        step={step}
        value={form[name]}
        required={required}
        onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))}
      />
    </label>
  )
}

export default function BatterySelector({ mobile = false }) {
  const {
    batteries,
    selectedBattery,
    batteriesLoading,
    batteryActionLoading,
    batteriesError,
    selectBattery,
    addBattery,
  } = useApp()
  const [open, setOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!addOpen) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [addOpen])

  const openAdd = () => {
    setOpen(false)
    setFormError('')
    setForm(emptyForm)
    setAddOpen(true)
  }

  const submit = async (event) => {
    event.preventDefault()
    setFormError('')
    const payload = {
      ...form,
      rated_capacity_mah: Number(form.rated_capacity_mah),
      nominal_voltage: Number(form.nominal_voltage),
      manufacture_date: form.manufacture_date || null,
      purchase_date: form.purchase_date || null,
      installation_date: form.installation_date || null,
    }
    if (!payload.serial_number || !payload.manufacturer || !payload.model || !payload.chemistry
      || !payload.rated_capacity_mah || !payload.nominal_voltage) {
      setFormError('Complete all required battery details before saving.')
      return
    }
    try {
      const created = await addBattery(payload)
      if (created) setAddOpen(false)
    } catch (error) {
      const message = error.statusCode === 401
        ? 'Your session has expired. Sign in again, then add the battery.'
        : error.statusCode === 403
          ? 'You do not have permission to add batteries to this account.'
          : error.statusCode === 409
            ? 'This serial number is already registered. Use a different serial number.'
            : error.message || 'The battery could not be added. Check the details and try again.'
      setFormError(message)
    }
  }

  const label = selectedBattery?.model || selectedBattery?.serial_number || 'Select battery'

  return (
    <>
      <div className={`relative ${mobile ? 'w-full' : ''}`}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={`flex items-center gap-2 rounded-full border border-white/80 bg-white/70 text-left text-ink shadow-sm backdrop-blur transition hover:border-primary/30 hover:bg-white ${mobile ? 'w-full justify-between px-4 py-3' : 'max-w-[220px] px-3 py-2'}`}
          aria-haspopup="listbox"
          aria-expanded={open}
          title={selectedBattery ? `Selected battery: ${selectedBattery.serial_number}` : 'Select a battery'}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lightmint text-primary">
              <Battery className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-bold">{label}</span>
              <span className="block truncate text-[10px] text-muted">{selectedBattery?.serial_number || 'No battery selected'}</span>
            </span>
          </span>
          {batteriesLoading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" /> : <ChevronDown className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />}
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              className={`glass-strong absolute z-[70] mt-2 w-[min(88vw,300px)] p-2 ${mobile ? 'left-0' : 'right-0'}`}
              role="listbox"
              aria-label="Available batteries"
            >
              <div className="flex items-center justify-between px-3 py-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">Your batteries</p>
                  <p className="mt-0.5 text-[11px] text-muted">Choose the battery to monitor</p>
                </div>
                <button type="button" onClick={openAdd} className="rounded-full bg-lightmint p-2 text-primary transition hover:bg-mint" aria-label="Add battery" title="Add battery">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {batteries.map((battery) => (
                  <button
                    key={battery.battery_id}
                    type="button"
                    role="option"
                    aria-selected={battery.battery_id === selectedBattery?.battery_id}
                    disabled={batteryActionLoading}
                    onClick={async () => { await selectBattery(battery); setOpen(false) }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${battery.battery_id === selectedBattery?.battery_id ? 'bg-lightmint text-darkgreen' : 'text-ink hover:bg-white/80'}`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/80 text-primary"><Battery className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{battery.model || battery.serial_number}</span>
                      <span className="block truncate text-xs text-muted">{battery.serial_number} · {battery.rated_capacity_mah ?? '—'} mAh</span>
                    </span>
                    {battery.battery_id === selectedBattery?.battery_id && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  </button>
                ))}
              </div>
              {!batteries.length && !batteriesLoading && (
                <p className="px-3 py-4 text-center text-xs text-muted">No batteries yet. Add your first battery below.</p>
              )}
              {batteriesError && <p className="px-3 py-2 text-xs text-red-600">{batteriesError}</p>}
              <button type="button" onClick={openAdd} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/25 px-3 py-2.5 text-sm font-semibold text-darkgreen transition hover:bg-lightmint">
                <Plus className="h-4 w-4" /> Add battery
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {addOpen && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] overflow-y-auto bg-ink/30 p-4 backdrop-blur-sm sm:p-6"
            onClick={() => setAddOpen(false)}
          >
            <div className="flex min-h-full items-center justify-center py-2 sm:py-4">
              <motion.form
                initial={{ opacity: 0, y: 24, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.985 }}
                onSubmit={submit}
                onClick={(event) => event.stopPropagation()}
                className="glass-strong max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-glass p-6 sm:max-h-[calc(100dvh-3rem)] sm:p-8"
                aria-label="Add battery"
              >
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="label-caps">Battery library</p>
                    <h2 className="mt-1 font-poppins text-2xl font-bold text-ink">Add a battery</h2>
                    <p className="mt-1 text-sm text-muted">Save the battery to your account and make it the selected monitor.</p>
                  </div>
                  <button type="button" onClick={() => setAddOpen(false)} className="rounded-full border border-white/80 bg-white/70 p-2 text-muted hover:text-ink" aria-label="Close add battery dialog">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Serial number" name="serial_number" form={form} setForm={setForm} required />
                  <Field label="Manufacturer" name="manufacturer" form={form} setForm={setForm} required />
                  <Field label="Model" name="model" form={form} setForm={setForm} required />
                  <Field label="Chemistry" name="chemistry" form={form} setForm={setForm} required />
                  <Field label="Rated capacity (mAh)" name="rated_capacity_mah" form={form} setForm={setForm} required type="number" step="1" />
                  <Field label="Nominal voltage (V)" name="nominal_voltage" form={form} setForm={setForm} required type="number" step="0.01" />
                </div>
                <div className="mt-5 border-t border-primary/10 pt-5">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">Dates (optional)</p>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Manufactured" name="manufacture_date" form={form} setForm={setForm} type="date" />
                    <Field label="Purchased" name="purchase_date" form={form} setForm={setForm} type="date" />
                    <Field label="Installed" name="installation_date" form={form} setForm={setForm} type="date" />
                  </div>
                </div>
                {formError && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{formError}</p>}
                <div className="mt-7 flex flex-col-reverse justify-end gap-3 sm:flex-row">
                  <button type="button" onClick={() => setAddOpen(false)} className="btn-secondary !px-5 !py-2.5">Cancel</button>
                  <button type="submit" className="btn-primary !px-5 !py-2.5" disabled={batteryActionLoading}>
                    {batteryActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Add battery
                  </button>
                </div>
              </motion.form>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}
