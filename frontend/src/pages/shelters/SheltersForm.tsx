import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import LocationPicker from '../../components/LocationPicker';
import { CustomButton, CustomSelect, Breadcrumb, PhoneWithCountryInput, validatePhone, Loader } from '../../components/ui';

const statusBadge: any = { open: 'green', full: 'red', closed: 'gray', preparing: 'yellow' };
const TYPES = ['school', 'community_center', 'community_hall', 'temple', 'stadium', 'hotel', 'camp', 'hospital', 'other'];
const FACILITIES = [
  ['foodAvailable', 'Food Available'],
  ['drinkingWater', 'Drinking Water'],
  ['medicalSupport', 'Medical Support'],
  ['electricity', 'Electricity'],
  ['washrooms', 'Washrooms'],
  ['wifi', 'WiFi'],
  ['womenArea', 'Women Area'],
  ['childrenArea', 'Children Area'],
  ['wheelchairAccess', 'Wheelchair Access'],
] as const;

interface SheltersFormProps {
  editing: any;
  form: {
    name: string;
    type: string;
    status: string;
    capacity: number | string;
    currentOccupancy: number | string;
    contactPerson: string;
    contactPhone: string;
    countryCode?: string;
    location: { lat: string | number; lng: string | number; address: string };
    facilities: Record<string, boolean>;
  };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitting?: boolean;
  loading?: boolean;
}

export const SheltersForm: React.FC<SheltersFormProps> = ({
  editing,
  form,
  setForm,
  onSubmit,
  onCancel,
  submitting = false,
  loading = false,
}) => {
  const submitText = editing ? 'Update Shelter' : 'Add Shelter';

  const shelterValidationSchema = Yup.object().shape({
    name: Yup.string()
      .trim()
      .required('Please enter Shelter Name')
      .min(2, 'Shelter Name must be at least 2 characters')
      .max(100, 'Shelter Name must be at most 100 characters'),
    capacity: Yup.number().typeError('Please enter Capacity').min(1, 'Capacity must be at least 1').required('Please enter Capacity'),
    locationAddress: Yup.string().trim().required('Please enter Location Address'),
    contactPhone: Yup.string()
      .trim()
      .test('phone-validation', function (val) {
        if (!val) return true;
        const err = validatePhone(form.countryCode || '+91', val, false);
        if (err) return this.createError({ message: err });
        return true;
      }),
  });

  const formik = useFormik({
    initialValues: {
      name: form.name || '',
      capacity: form.capacity || '',
      locationAddress: form.location?.address || '',
    },
    enableReinitialize: true,
    validationSchema: shelterValidationSchema,
    onSubmit: () => {
      if (form.contactPhone) {
        const phoneErr = validatePhone(form.countryCode || '+91', form.contactPhone, false);
        if (phoneErr) {
          toast.error(phoneErr);
          return;
        }
      }
      const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
      onSubmit(syntheticEvent);
    },
  });

  if (loading) {
    return (
      <div className="page">
        <Loader variant="page" text="Loading shelter details..." subtext="Retrieving capacity and amenities..." />
      </div>
    );
  }

  return (
    <div className="page" style={{ position: 'relative' }}>
      {submitting && (
        <Loader
          variant="overlay"
          text={editing ? "Updating shelter..." : "Registering shelter..."}
          subtext="Saving shelter details..."
        />
      )}
      <Breadcrumb
        items={[
          { label: 'Shelters', onClick: onCancel },
          { label: editing ? `Edit Shelter` : 'Add New Shelter' }
        ]}
      />

      <form onSubmit={formik.handleSubmit} noValidate>
        <div className="page-header">
          <div>
            <h1 className="page-title">{editing ? 'Edit Emergency Shelter' : 'Add Emergency Shelter'}</h1>
            <div className="page-subtitle">
              {editing ? 'Update shelter capacity, current occupancy, and facilities' : 'Register a new relief shelter or safe haven'}
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
              Shelter Name <span className="required-star" style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '2px' }}>*</span>
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
              placeholder="e.g. St. Mary High School Shelter"
            />
            {formik.touched.name && formik.errors.name && (
              <div className="form-error-msg">{formik.errors.name}</div>
            )}
          </div>

          <div className="form-grid-2">
            <CustomSelect label="Facility Type" options={TYPES} value={form.type} onChange={val => setForm((p: any) => ({ ...p, type: val }))} />
            <CustomSelect label="Operational Status" options={Object.keys(statusBadge)} value={form.status} onChange={val => setForm((p: any) => ({ ...p, status: val }))} />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">
                Maximum Capacity <span className="required-star" style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '2px' }}>*</span>
              </label>
              <input
                name="capacity"
                className={`form-input ${formik.touched.capacity && formik.errors.capacity ? 'is-invalid' : ''}`}
                type="number"
                min={1}
                value={form.capacity}
                onChange={e => {
                  formik.handleChange(e);
                  setForm((p: any) => ({ ...p, capacity: e.target.value }));
                }}
                onBlur={formik.handleBlur}
              />
              {formik.touched.capacity && formik.errors.capacity && (
                <div className="form-error-msg">{formik.errors.capacity}</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Current Occupancy</label>
              <input className="form-input" type="number" min={0} value={form.currentOccupancy} onChange={e => setForm((p: any) => ({ ...p, currentOccupancy: e.target.value }))} />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Contact Person</label>
              <input className="form-input" value={form.contactPerson} onChange={e => setForm((p: any) => ({ ...p, contactPerson: e.target.value }))} placeholder="In-charge manager name" />
            </div>
            <PhoneWithCountryInput
              label="Contact Phone"
              countryCode={form.countryCode}
              contactPhone={form.contactPhone}
              onCountryCodeChange={code => setForm((p: any) => ({ ...p, countryCode: code }))}
              onContactPhoneChange={phone => setForm((p: any) => ({ ...p, contactPhone: phone }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Location Address <span className="required-star" style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '2px' }}>*</span>
            </label>
            <input
              name="locationAddress"
              className={`form-input ${formik.touched.locationAddress && formik.errors.locationAddress ? 'is-invalid' : ''}`}
              value={form.location.address}
              onChange={e => {
                formik.handleChange(e);
                setForm((p: any) => ({ ...p, location: { ...p.location, address: e.target.value } }));
              }}
              onBlur={formik.handleBlur}
              placeholder="Full physical address"
            />
            {formik.touched.locationAddress && formik.errors.locationAddress && (
              <div className="form-error-msg">{formik.errors.locationAddress}</div>
            )}
          </div>

          <LocationPicker
            value={form.location}
            onChange={location => {
              setForm((p: any) => ({ ...p, location: { ...p.location, ...location } }));
              formik.setFieldValue('locationAddress', location.address || '');
            }}
            label="Shelter location *"
          />

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Latitude</label>
              <input className="form-input" value={form.location.lat} readOnly aria-label="Selected latitude" />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude</label>
              <input className="form-input" value={form.location.lng} readOnly aria-label="Selected longitude" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ marginBottom: 12 }}>Available Facilities & Provisions</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {FACILITIES.map(([key, label]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={form.facilities[key] || false}
                    onChange={e => setForm((p: any) => ({ ...p, facilities: { ...p.facilities, [key]: e.target.checked } }))}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SheltersForm;
