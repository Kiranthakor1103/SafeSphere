import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import LocationPicker from '../../components/LocationPicker';
import { CustomButton, CustomSelect, Breadcrumb, PhoneWithCountryInput, validatePhone, Loader } from '../../components/ui';

const statusBadge: any = { available: 'green', deployed: 'red', standby: 'yellow', off_duty: 'gray' };
const SPECIALIZATIONS = ['flood_rescue', 'firefighting', 'first_aid', 'hazmat', 'k9_search', 'mountain_rescue', 'medical_evac'];
const VEHICLE_OPTIONS = ['AirCraft', 'Helicopter', 'Boat', 'Truck', 'Car', 'Ambulance', 'Heavy Rig', 'SUV', 'Other'];

interface RescueTeamsFormProps {
  editing: any;
  form: {
    name: string;
    specialization: string[];
    status: string;
    contactPhone: string;
    countryCode?: string;
    vehicleType: string;
    capacity: number | string;
    location?: { lat: number | string; lng: number | string; address: string };
  };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  toggleSpec: (spec: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitting?: boolean;
  loading?: boolean;
}

export const RescueTeamsForm: React.FC<RescueTeamsFormProps> = ({
  editing,
  form,
  setForm,
  toggleSpec,
  onSubmit,
  onCancel,
  submitting = false,
  loading = false,
}) => {
  const submitText = editing ? 'Save Changes' : 'Create Team';

  const rescueTeamValidationSchema = Yup.object().shape({
    name: Yup.string()
      .trim()
      .required('Please enter Team Name')
      .min(2, 'Team Name must be at least 2 characters')
      .max(100, 'Team Name must be at most 100 characters'),
    contactPhone: Yup.string()
      .trim()
      .required('Please enter Contact Phone')
      .test('phone-validation', function (val) {
        const err = validatePhone(form.countryCode || '+91', val || '', true);
        if (err) return this.createError({ message: err });
        return true;
      }),
  });

  const formik = useFormik({
    initialValues: {
      name: form.name || '',
      contactPhone: form.contactPhone || '',
    },
    enableReinitialize: true,
    validationSchema: rescueTeamValidationSchema,
    onSubmit: () => {
      const phoneErr = validatePhone(form.countryCode || '+91', form.contactPhone, true);
      if (phoneErr) {
        toast.error(phoneErr);
        return;
      }
      const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
      onSubmit(syntheticEvent);
    },
  });

  if (loading) {
    return (
      <div className="page">
        <Loader variant="page" text="Loading rescue team details..." subtext="Retrieving team configuration..." />
      </div>
    );
  }

  return (
    <div className="page" style={{ position: 'relative' }}>
      {submitting && (
        <Loader
          variant="overlay"
          text={editing ? "Updating rescue team..." : "Creating rescue team..."}
          subtext="Saving rescue unit profile..."
        />
      )}
      <Breadcrumb
        items={[
          { label: 'Rescue Teams', onClick: onCancel },
          { label: editing ? `Edit Rescue Team` : 'Add New Rescue Team' }
        ]}
      />

      <form onSubmit={formik.handleSubmit} noValidate>
        <div className="page-header">
          <div>
            <h1 className="page-title">{editing ? 'Edit Rescue Team' : 'Create Rescue Team'}</h1>
            <div className="page-subtitle">
              {editing ? 'Update team specialization and vehicle capabilities' : 'Assemble a new emergency response unit for rapid deployment'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <CustomButton type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
              Cancel
            </CustomButton>
            <CustomButton type="submit" variant="primary" loading={submitting}>
              {submitText}
            </CustomButton>
          </div>
        </div>

        <div className="card form-card">
          <div className="form-group">
            <label className="form-label">
              Team Name <span className="required-star" style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '2px' }}>*</span>
            </label>
            <input
              name="name"
              className={`form-input ${formik.touched.name && formik.errors.name ? 'is-invalid' : ''}`}
              value={form.name}
              onChange={e => {
                formik.handleChange(e);
                setForm((p: any) => ({ ...p, name: e.target.value }));
              }}
              onBlur={formik.handleBlur}
              placeholder="e.g. Alpha Coastal Search & Rescue"
            />
            {formik.touched.name && formik.errors.name && (
              <div className="form-error-msg">{formik.errors.name}</div>
            )}
          </div>

          <div className="form-grid-2">
            <CustomSelect
              label="Status"
              options={Object.keys(statusBadge)}
              value={form.status}
              onChange={val => setForm((p: any) => ({ ...p, status: val }))}
            />
            <PhoneWithCountryInput
              label="Contact Phone"
              required
              countryCode={form.countryCode}
              contactPhone={form.contactPhone}
              onCountryCodeChange={code => setForm((p: any) => ({ ...p, countryCode: code }))}
              onContactPhoneChange={phone => {
                formik.setFieldValue('contactPhone', phone);
                setForm((p: any) => ({ ...p, contactPhone: phone }));
              }}
              onBlur={formik.handleBlur}
              error={formik.errors.contactPhone}
              touched={formik.touched.contactPhone}
            />
          </div>

          <div className="form-group" style={{ marginTop: 16, marginBottom: 16 }}>
            <LocationPicker
              label="Base / Current Team Station Location"
              value={form.location || { address: '', lat: 0, lng: 0 }}
              onChange={(loc) => setForm((p: any) => ({ ...p, location: loc }))}
            />
          </div>

          <div className="form-grid-2">
            <CustomSelect
              label="Vehicle / Transport Type"
              options={VEHICLE_OPTIONS}
              value={form.vehicleType || 'Car'}
              onChange={val => setForm((p: any) => ({ ...p, vehicleType: val }))}
            />
            <div className="form-group">
              <label className="form-label">Team Capacity / Members Count</label>
              <input
                className="form-input"
                type="number"
                min={1}
                value={form.capacity}
                onChange={e => setForm((p: any) => ({ ...p, capacity: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ marginBottom: 12 }}>Specialization Domains (Multi-Select)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10 }}>
              {SPECIALIZATIONS.map(spec => {
                const isChecked = form.specialization.includes(spec);
                return (
                  <label
                    key={spec}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: isChecked ? '1.5px solid var(--accent-blue, #2563eb)' : '1px solid var(--border-color, #e2e8f0)',
                      backgroundColor: isChecked ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-card, #ffffff)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease-in-out',
                      userSelect: 'none',
                      boxShadow: isChecked ? '0 2px 4px rgba(37, 99, 235, 0.1)' : 'none',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSpec(spec)}
                      style={{ cursor: 'pointer', width: 16, height: 16, accentColor: 'var(--accent-blue, #2563eb)' }}
                    />
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: isChecked ? 600 : 400,
                        color: isChecked ? 'var(--accent-blue, #2563eb)' : 'var(--text-main, #1e293b)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {spec.replace('_', ' ')}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RescueTeamsForm;
