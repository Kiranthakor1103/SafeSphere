import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { Send } from 'lucide-react';
import LocationPicker from '../../components/LocationPicker';
import { CustomButton, CustomSelect, Breadcrumb, PhoneWithCountryInput, validatePhone, Loader } from '../../components/ui';
import { getCountries, getStatesForCountry, getDistrictsForState } from '../../utils/locationData';

const TYPES = ['rescue', 'medical', 'food_water', 'evacuation', 'other'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

interface SOSFormProps {
  form: {
    type: string;
    priority: string;
    message: string;
    country?: string;
    state?: string;
    district?: string;
    location: { lat: string | number; lng: string | number; address: string };
    contactPhone: string;
    countryCode?: string;
    numberOfPeople: string | number;
  };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitting?: boolean;
  loading?: boolean;
}

export const SOSForm: React.FC<SOSFormProps> = ({
  form,
  setForm,
  onSubmit,
  onCancel,
  submitting = false,
  loading = false,
}) => {
  const currentCountry = form.country || 'Select Country';
  const availableStates = getStatesForCountry(currentCountry, 'Select State');
  const currentState = availableStates.includes(form.state || '') ? (form.state || 'Select State') : 'Select State';
  const availableDistricts = getDistrictsForState(currentCountry, currentState, 'Select District / Region');
  const currentDistrict = availableDistricts.includes(form.district || '') ? (form.district || 'Select District / Region') : 'Select District / Region';

  const handleCountryChange = (country: string) => {
    setForm((p: any) => ({
      ...p,
      country,
      state: 'Select State',
      district: 'Select District / Region'
    }));
  };

  const handleStateChange = (state: string) => {
    setForm((p: any) => ({
      ...p,
      state,
      district: 'Select District / Region'
    }));
  };

  const handleDistrictChange = (district: string) => {
    setForm((p: any) => ({
      ...p,
      district
    }));
  };

  const sosValidationSchema = Yup.object().shape({
    contactPhone: Yup.string()
      .trim()
      .required('Please enter Contact Phone')
      .test('phone-validation', function (val) {
        const err = validatePhone(form.countryCode || '+91', val || '', true);
        if (err) return this.createError({ message: err });
        return true;
      }),
    locationAddress: Yup.string().trim().required('Please enter Location Address'),
    message: Yup.string()
      .trim()
      .required('Please enter Emergency Message')
      .max(500, 'Emergency Message must be at most 500 characters'),
    numberOfPeople: Yup.number().typeError('Please enter Number of People').min(1, 'At least 1 person affected').required('Please enter Number of People'),
  });

  const formik = useFormik({
    initialValues: {
      contactPhone: form.contactPhone || '',
      locationAddress: form.location?.address || '',
      message: form.message || '',
      numberOfPeople: form.numberOfPeople || 1,
    },
    enableReinitialize: true,
    validationSchema: sosValidationSchema,
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
        <Loader variant="page" text="Loading SOS form..." subtext="Initializing emergency broadcast tools..." />
      </div>
    );
  }

  return (
    <div className="page" style={{ position: 'relative' }}>
      {submitting && (
        <Loader
          variant="overlay"
          text="Broadcasting SOS alert..."
          subtext="Notifying emergency dispatchers and rescue teams..."
        />
      )}
      <Breadcrumb
        items={[
          { label: 'SOS Alerts', onClick: onCancel },
          { label: 'Add New SOS Alert' }
        ]}
      />

      <form onSubmit={formik.handleSubmit} noValidate>
        <div className="page-header">
          <div>
            <h1 className="page-title">Send Emergency SOS Alert</h1>
            <div className="page-subtitle">Broadcast immediate emergency assistance request</div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <CustomButton type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
              Cancel
            </CustomButton>
            <CustomButton type="submit" variant="primary" icon={<Send size={16} />} loading={submitting}>
              Broadcast SOS Alert
            </CustomButton>
          </div>
        </div>

        <div className="card form-card">
          <div className="form-grid-2">
            <CustomSelect label="Emergency Type *" options={TYPES} value={form.type} onChange={val => setForm((p: any) => ({ ...p, type: val }))} />
            <CustomSelect label="Priority Level *" options={PRIORITIES} value={form.priority} onChange={val => setForm((p: any) => ({ ...p, priority: val }))} />
          </div>

          <div className="form-grid-2">
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
            <div className="form-group">
              <label className="form-label">
                Number of People Affected <span className="required-star" style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '2px' }}>*</span>
              </label>
              <input
                name="numberOfPeople"
                className={`form-input ${formik.touched.numberOfPeople && formik.errors.numberOfPeople ? 'is-invalid' : ''}`}
                type="number"
                min={1}
                value={form.numberOfPeople}
                onChange={e => {
                  formik.handleChange(e);
                  setForm((p: any) => ({ ...p, numberOfPeople: e.target.value }));
                }}
                onBlur={formik.handleBlur}
              />
              {formik.touched.numberOfPeople && formik.errors.numberOfPeople && (
                <div className="form-error-msg">{formik.errors.numberOfPeople}</div>
              )}
            </div>
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
              placeholder="Location address"
            />
            {formik.touched.locationAddress && formik.errors.locationAddress && (
              <div className="form-error-msg">{formik.errors.locationAddress}</div>
            )}
          </div>

          <div className="form-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <CustomSelect
              label="Country"
              options={getCountries()}
              value={currentCountry}
              onChange={handleCountryChange}
            />

            <CustomSelect
              label="State"
              options={availableStates}
              value={currentState}
              onChange={handleStateChange}
            />

            <CustomSelect
              label="District / Region"
              options={availableDistricts}
              value={currentDistrict}
              onChange={handleDistrictChange}
            />
          </div>

          <LocationPicker
            value={form.location}
            onChange={location => {
              setForm((p: any) => ({ ...p, location: { ...p.location, ...location } }));
              formik.setFieldValue('locationAddress', location.address || '');
            }}
            label="Emergency location *"
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
            <label className="form-label">
              Emergency Message <span className="required-star" style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '2px' }}>*</span>
            </label>
            <textarea
              name="message"
              className={`form-input ${formik.touched.message && formik.errors.message ? 'is-invalid' : ''}`}
              rows={4}
              value={form.message}
              onChange={e => {
                formik.handleChange(e);
                setForm((p: any) => ({ ...p, message: e.target.value }));
              }}
              onBlur={formik.handleBlur}
              style={{ resize: 'vertical' }}
              placeholder="Describe immediate dangers, injuries, or critical resource needs..."
            />
            {formik.touched.message && formik.errors.message && (
              <div className="form-error-msg">{formik.errors.message}</div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default SOSForm;
