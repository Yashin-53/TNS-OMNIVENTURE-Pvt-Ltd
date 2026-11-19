import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ImagePlus, Store, Video, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import { AMENITIES, PROPERTY_TYPES } from '../data/constants';
import { INDIAN_STATES, POPULAR_CITIES } from '../data/locations';
import { UNITS } from '../utils/units';
import { formatFull, getPriceBreakdown } from '../utils/format';
import { MAX_IMAGES, MAX_VIDEOS, MAX_FILE_MB, MAX_VIDEO_SECONDS } from '../data/mediaLimits';
import { compressImage } from '../utils/compressImage';
import { checkVideo } from '../utils/checkVideo';

const emptyForm = {
  title: '', listingType: 'sale', type: 'flat',
  address: '', city: '', state: '', pincode: '',
  area: '', unit: 'sqft', bedrooms: '', bathrooms: '',
  price: '', stampDuty: '', registration: '', gst: '',
  description: '', highlights: '',
};

function Section({ title, hint, children }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {hint && <p className="mt-0.5 text-sm text-slate-500">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

// Used for both "Post property" and "Edit property" (when :id is in the URL)
export default function PostProperty() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [amenities, setAmenities] = useState([]);
  const [otherAmenities, setOtherAmenities] = useState('');
  const [existingImages, setExistingImages] = useState([]);
  const [existingVideos, setExistingVideos] = useState([]);
  const [removeImages, setRemoveImages] = useState([]);
  const [removeVideos, setRemoveVideos] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newVideos, setNewVideos] = useState([]);
  const [newImageSizes, setNewImageSizes] = useState([]);
  const [compressing, setCompressing] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [loading, setLoading] = useState(isEdit);
  const [busy, setBusy] = useState(false);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    api.get('/properties/cities')
      .then(({ data }) => setCities(data.map((item) => item.city)))
      .catch((err) => toast.error(errMsg(err)));
  }, []);

  // edit mode: load the current values
  useEffect(() => {
    if (!isEdit) return;
    api.get(`/properties/${id}`)
      .then(({ data: p }) => {
        setForm({
          title: p.title, listingType: p.listingType, type: p.type,
          address: p.location.address, city: p.location.city, state: p.location.state, pincode: p.location.pincode || '',
          area: p.dimension.area, unit: p.dimension.unit, bedrooms: p.bedrooms ?? '', bathrooms: p.bathrooms ?? '',
          price: p.price, stampDuty: p.taxes.stampDuty || '', registration: p.taxes.registration || '', gst: p.taxes.gst || '',
          description: p.description, highlights: p.highlights.join('\n'),
        });
        setAmenities(p.amenities.filter((a) => AMENITIES.includes(a)));
        setOtherAmenities(p.amenities.filter((a) => !AMENITIES.includes(a)).join(', '));
        setExistingImages(p.images);
        setExistingVideos(p.videos);
      })
      .catch((err) => { toast.error(errMsg(err)); navigate('/'); })
      .finally(() => setLoading(false));
  }, [id]);

  const imagePreviews = useMemo(() => newImages.map((f) => URL.createObjectURL(f)), [newImages]);
  const citySuggestions = useMemo(
    () => [...new Map([...cities, ...POPULAR_CITIES].map((cityName) => [cityName.toLowerCase(), cityName])).values()],
    [cities]
  );
  const hasUnlistedState = form.state && !INDIAN_STATES.includes(form.state);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const toggleAmenity = (a) => setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  const toggleRemove = (setter, mediaId) => setter((prev) => (prev.includes(mediaId) ? prev.filter((x) => x !== mediaId) : [...prev, mediaId]));

  const keptImageCount = existingImages.filter((i) => !removeImages.includes(i._id)).length;
  const keptVideoCount = existingVideos.filter((v) => !removeVideos.includes(v._id)).length;

  const addPhotos = async (e) => {
    const files = Array.from(e.target.files);
    e.target.value = '';
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const remaining = MAX_IMAGES - (keptImageCount + newImages.length);
    if (remaining <= 0) {
      toast.error('You can add up to 4 photos. Remove one to add another.');
      return;
    }
    if (files.length > remaining) {
      toast.error('You can add up to 4 photos. Remove one to add another.');
    }
    setCompressing(true);
    const accepted = [];
    const sizes = [];
    for (const file of files.slice(0, remaining)) {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`“${file.name}” isn’t supported. Use JPG, PNG or WebP photos.`);
        continue;
      }
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        toast.error(`“${file.name}” is ${(file.size / 1024 / 1024).toFixed(1)} MB. Photos must be 10 MB or smaller.`);
        continue;
      }
      try {
        const compressed = await compressImage(file);
        accepted.push(compressed);
        sizes.push({ before: file.size, after: compressed.size });
      } catch (err) {
        toast.error(err.message || 'Could not compress this photo.');
      }
    }
    setNewImages((prev) => [...prev, ...accepted]);
    setNewImageSizes((prev) => [...prev, ...sizes]);
    setCompressing(false);
  };

  const addVideo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    if (keptVideoCount + newVideos.length >= MAX_VIDEOS) {
      toast.error('Only 1 video is allowed. Remove the current one to add another.');
      return;
    }
    if (!allowedTypes.includes(file.type)) {
      toast.error(`“${file.name}” isn’t supported. Use an MP4, MOV or WebM video.`);
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`“${file.name}” is ${(file.size / 1024 / 1024).toFixed(1)} MB. Video must be 10 MB or smaller. Try a shorter clip or a lower resolution.`);
      return;
    }
    try {
      const duration = await checkVideo(file);
      if (duration > MAX_VIDEO_SECONDS + 1) {
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60).toString().padStart(2, '0');
        toast.error(`“${file.name}” is ${minutes}:${seconds} long. Video must be 2 minutes or shorter.`);
        return;
      }
      setNewVideos((prev) => [...prev, file]);
    } catch (err) {
      toast.error(err.message || `Could not read “${file.name}”.`);
    }
  };
  const { lines, total } = getPriceBreakdown(Number(form.price) || 0, {
    stampDuty: Number(form.stampDuty), registration: Number(form.registration), gst: Number(form.gst),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (keptImageCount + newImages.length === 0) return toast.error('Add at least one photo');

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => key !== 'highlights' && data.append(key, value));
    data.append('highlights', JSON.stringify(form.highlights.split('\n').map((h) => h.trim()).filter(Boolean)));
    data.append('amenities', JSON.stringify([...amenities, ...otherAmenities.split(',').map((a) => a.trim()).filter(Boolean)]));
    newImages.forEach((f) => data.append('images', f));
    newVideos.forEach((f) => data.append('videos', f));
    if (isEdit) {
      data.append('removeImages', JSON.stringify(removeImages));
      data.append('removeVideos', JSON.stringify(removeVideos));
    }

    setBusy(true);
    setUploadPercent(0);
    try {
      const config = { onUploadProgress: (event) => {
        if (event.total) setUploadPercent(Math.round((event.loaded * 100) / event.total));
      } };
      const res = isEdit
        ? await api.put(`/properties/${id}`, data, config)
        : await api.post('/properties', data, config);
      toast.success(isEdit ? 'Property updated' : 'Property posted');
      navigate(`/properties/${res.data._id}`);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  // buyers need to switch to a seller account before posting
  const becomeSeller = async () => {
    try {
      const { data } = await api.put('/users/me', { role: 'seller' });
      setUser(data);
      toast.success('Your account is now a seller account');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  if (loading) return <Loader />;

  if (user.role === 'buyer') {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <Store size={44} className="mx-auto text-river" />
        <h1 className="mt-4 text-3xl font-bold">Switch to a seller account</h1>
        <p className="mt-2 text-slate-600">Your account is set up to buy and rent. Switch to a seller account to post properties. You can still browse and review as before.</p>
        <button onClick={becomeSeller} className="btn btn-primary mt-6">Become a seller</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold">{isEdit ? 'Edit property' : 'Post a property'}</h1>
      <p className="mt-1 text-slate-600">The more complete your listing, the more enquiries you get.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <Section title="Basic details">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Title">
                <input name="title" className="input" value={form.title} onChange={handleChange} maxLength={120} placeholder="e.g. 3 BHK apartment near Swaroop Nagar" required />
              </Field>
            </div>
            <Field label="Listing type">
              <select name="listingType" className="input" value={form.listingType} onChange={handleChange}>
                <option value="sale">For sale</option>
                <option value="rent">For rent</option>
              </select>
            </Field>
            <Field label="Property type">
              <select name="type" className="input" value={form.type} onChange={handleChange}>
                {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
          </div>
        </Section>

        <Section title="Location">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Address / locality">
                <input name="address" className="input" value={form.address} onChange={handleChange} required />
              </Field>
            </div>
            <Field label="City">
              <input name="city" list="property-cities" className="input" value={form.city} onChange={handleChange} required />
              <datalist id="property-cities">
                {citySuggestions.map((cityName) => <option key={cityName} value={cityName} />)}
              </datalist>
            </Field>
            <Field label="State">
              <select name="state" className="input" value={form.state} onChange={handleChange} required>
                <option value="" disabled>Select state</option>
                {hasUnlistedState && <option value={form.state}>{form.state}</option>}
                {INDIAN_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
              </select>
            </Field>
            <Field label="Pincode"><input name="pincode" className="input" value={form.pincode} onChange={handleChange} maxLength={6} inputMode="numeric" /></Field>
          </div>
        </Section>

        <Section title="Size" hint="Buyers can view this in any unit. Enter it in the unit you know best.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Area">
              <div className="flex gap-2">
                <input name="area" type="number" min="1" step="any" className="input" value={form.area} onChange={handleChange} required />
                <select name="unit" className="input w-auto" value={form.unit} onChange={handleChange}>
                  {UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Bedrooms"><input name="bedrooms" type="number" min="0" className="input" value={form.bedrooms} onChange={handleChange} /></Field>
              <Field label="Bathrooms"><input name="bathrooms" type="number" min="0" className="input" value={form.bathrooms} onChange={handleChange} /></Field>
            </div>
          </div>
        </Section>

        <Section title="Price and taxes" hint={form.listingType === 'rent' ? 'Enter the monthly rent. Leave taxes empty if they do not apply.' : 'Taxes are shown separately to buyers, followed by the total amount.'}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label={form.listingType === 'rent' ? 'Rent per month (₹)' : 'Price (₹)'}>
                <input name="price" type="number" min="1" className="input" value={form.price} onChange={handleChange} required />
              </Field>
            </div>
            <Field label="Stamp duty (%)"><input name="stampDuty" type="number" min="0" step="any" className="input" value={form.stampDuty} onChange={handleChange} /></Field>
            <Field label="Registration (%)"><input name="registration" type="number" min="0" step="any" className="input" value={form.registration} onChange={handleChange} /></Field>
            <Field label="GST (%)"><input name="gst" type="number" min="0" step="any" className="input" value={form.gst} onChange={handleChange} /></Field>
          </div>
          {Number(form.price) > 0 && (
            <div className="mt-4 rounded-xl bg-river-light p-4 text-sm">
              {lines.map((l) => (
                <p key={l.label} className="flex justify-between"><span>{l.label} ({l.percent}%)</span><span>{formatFull(l.amount)}</span></p>
              ))}
              <p className="mt-2 flex justify-between border-t border-river/20 pt-2 text-base font-bold"><span>Total amount</span><span>{formatFull(total)}</span></p>
            </div>
          )}
        </Section>

        <Section title="Description">
          <div className="space-y-4">
            <Field label="About this property">
              <textarea name="description" rows={5} className="input" value={form.description} onChange={handleChange} required placeholder="Describe the property, surroundings, condition, nearby places…" />
            </Field>
            <Field label="Highlights (one per line)">
              <textarea name="highlights" rows={4} className="input" value={form.highlights} onChange={handleChange} placeholder={'East facing\nCovered parking\nReady to move in'} />
            </Field>
          </div>
        </Section>

        <Section title="Amenities">
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map((a) => (
              <button
                type="button"
                key={a}
                onClick={() => toggleAmenity(a)}
                aria-pressed={amenities.includes(a)}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition ${amenities.includes(a) ? 'border-river bg-river text-ink' : 'border-line bg-white hover:border-river'}`}
              >
                {a}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <Field label="Other amenities (comma separated)">
              <input className="input" value={otherAmenities} onChange={(e) => setOtherAmenities(e.target.value)} placeholder="Solar panels, Servant room" />
            </Field>
          </div>
        </Section>

        <Section title="Photos and videos" hint="Photos: up to 4 (JPG, PNG or WebP, up to 10 MB each). They are compressed automatically to under 1 MB. Video: 1 clip, up to 2 minutes and 10 MB (MP4, MOV or WebM). Short clips of 30 to 60 seconds load fastest.">
          <div className="mb-3 flex flex-wrap gap-3 text-sm font-medium text-slate-600">
            <span>{keptImageCount + newImages.length} of {MAX_IMAGES} photos</span>
            <span>{keptVideoCount + newVideos.length} of {MAX_VIDEOS} video</span>
            {compressing && <span className="text-river">Compressing…</span>}
          </div>
          <div className="flex flex-wrap gap-3">
            {existingImages.map((img) => (
              <div key={img._id} className={`relative h-24 w-32 overflow-hidden rounded-lg ${removeImages.includes(img._id) ? 'opacity-30' : ''}`}>
                <img src={img.url} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => toggleRemove(setRemoveImages, img._id)} aria-label="Remove photo" className="absolute right-1 top-1 rounded-full bg-ink/80 p-1 text-white"><X size={14} /></button>
              </div>
            ))}
            {newImages.map((file, i) => (
              <div key={i} className="relative h-24 w-32 overflow-hidden rounded-lg ring-2 ring-river">
                <img src={imagePreviews[i]} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => {
                  setNewImages((prev) => prev.filter((_, n) => n !== i));
                  setNewImageSizes((prev) => prev.filter((_, n) => n !== i));
                }} aria-label="Remove photo" className="absolute right-1 top-1 rounded-full bg-ink/80 p-1 text-white"><X size={14} /></button>
                {newImageSizes[i] && (
                  <span className="absolute bottom-0 left-0 right-0 bg-ink/70 px-1 py-0.5 text-center text-[10px] text-white">
                    {(newImageSizes[i].before / 1024 / 1024).toFixed(1)} MB → {newImageSizes[i].after < 1024 * 1024 ? `${Math.round(newImageSizes[i].after / 1024)} KB` : `${(newImageSizes[i].after / 1024 / 1024).toFixed(1)} MB`}
                  </span>
                )}
              </div>
            ))}
            {keptImageCount + newImages.length < MAX_IMAGES && (
              <label className="flex h-24 w-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-line text-sm text-slate-500 hover:border-river hover:text-river">
                <ImagePlus size={22} /> Add photos
                <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple className="hidden" onChange={addPhotos} />
              </label>
            )}
          </div>

          <div className="mt-4 space-y-2">
            {existingVideos.map((v, i) => (
              <div key={v._id} className={`flex items-center justify-between rounded-lg bg-mist px-3 py-2 text-sm ${removeVideos.includes(v._id) ? 'line-through opacity-40' : ''}`}>
                <span className="flex items-center gap-2"><Video size={16} /> Video {i + 1} (uploaded)</span>
                <button type="button" onClick={() => toggleRemove(setRemoveVideos, v._id)} aria-label="Remove video"><X size={16} /></button>
              </div>
            ))}
            {newVideos.map((file, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-mist px-3 py-2 text-sm">
                <span className="flex items-center gap-2 truncate"><Video size={16} /> {file.name}</span>
                <button type="button" onClick={() => setNewVideos((prev) => prev.filter((_, n) => n !== i))} aria-label="Remove video"><X size={16} /></button>
              </div>
            ))}
            {keptVideoCount + newVideos.length < MAX_VIDEOS && (
              <label className="btn btn-outline cursor-pointer">
                <Video size={16} /> Add video
                <input type="file" accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm" className="hidden" onChange={addVideo} />
              </label>
            )}
          </div>
        </Section>

        <div className="flex gap-3">
          <button disabled={busy} className="btn btn-primary px-8">{busy ? (uploadPercent > 0 ? `Uploading ${uploadPercent}%…` : 'Uploading…') : isEdit ? 'Save changes' : 'Post property'}</button>
          <Link to={isEdit ? `/properties/${id}` : '/'} className="btn btn-outline">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
