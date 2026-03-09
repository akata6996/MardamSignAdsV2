const BUSINESS_EMAIL = 'mardamsignads@gmail.com';
const MAX_REFERENCE_SIZE_MB = 10;
const FORMSUBMIT_ENDPOINT = `https://formsubmit.co/ajax/${BUSINESS_EMAIL}`;

const form = document.getElementById('appointment-form');
const year = document.getElementById('year');
const modal = document.getElementById('appointment-modal');
const modalPanel = modal?.querySelector('.modal-panel');
const openButtons = document.querySelectorAll('[data-open-appointment]');
const closeButtons = document.querySelectorAll('[data-close-appointment]');
const statusBox = document.getElementById('appointment-status');
const submitButton = form?.querySelector('button[type="submit"]');

if (year) {
  year.textContent = new Date().getFullYear();
}

if (window.AOS) {
  window.AOS.init({
    duration: 800,
    once: true,
    offset: 50,
  });
}

const isDialogSupported =
  typeof HTMLDialogElement !== 'undefined' &&
  typeof modal?.showModal === 'function';

const setStatus = (message, type = 'info') => {
  if (!statusBox) {
    return;
  }

  statusBox.textContent = message;
  statusBox.dataset.state = type;
};

const openModal = () => {
  if (!modal) {
    return;
  }

  if (isDialogSupported) {
    modal.showModal();
  } else {
    modal.setAttribute('open', '');
    document.body.classList.add('modal-open-fallback');
  }

  window.setTimeout(() => {
    modalPanel?.focus();
  }, 0);
};

const closeModal = () => {
  if (!modal) {
    return;
  }

  if (isDialogSupported) {
    modal.close();
  } else {
    modal.removeAttribute('open');
    document.body.classList.remove('modal-open-fallback');
  }

  setStatus('');
};

const sanitizeText = (value) => value.replace(/[<>]/g, '').trim();

const parseAndValidate = () => {
  if (!form) {
    return { valid: false, error: 'Appointment form is unavailable.' };
  }

  const formData = new FormData(form);
  const referenceFile = formData.get('referenceFile');
  const referenceFileName = referenceFile instanceof File ? referenceFile.name : '';

  const details = {
    name: sanitizeText(formData.get('name')?.toString() || ''),
    email: formData.get('email')?.toString().trim() || '',
    phone: formData.get('phone')?.toString().trim() || '',
    service: sanitizeText(formData.get('service')?.toString() || ''),
    description: sanitizeText(formData.get('description')?.toString() || ''),
    referenceFileName,
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[+\d][\d\s-]{7,20}$/;

  if (!details.name || !details.email || !details.phone || !details.service || !details.description) {
    return { valid: false, error: 'Please complete all required fields.' };
  }

  if (!emailRegex.test(details.email)) {
    return { valid: false, error: 'Please provide a valid email address.' };
  }

  if (!phoneRegex.test(details.phone)) {
    return { valid: false, error: 'Please provide a valid contact number.' };
  }

  if (referenceFile instanceof File && referenceFile.size > MAX_REFERENCE_SIZE_MB * 1024 * 1024) {
    return {
      valid: false,
      error: `Reference file must be ${MAX_REFERENCE_SIZE_MB}MB or less.`,
    };
  }

  return { valid: true, details };
};

const sendAppointmentRequest = async (details) => {
  const payload = {
    _subject: `Appointment Request - ${details.service || 'General Inquiry'}`,
    name: details.name,
    email: details.email,
    phone: details.phone,
    service: details.service,
    description: details.description,
    referenceFile: details.referenceFileName || 'No file selected',
  };

  const response = await fetch(FORMSUBMIT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || 'Unable to send your request right now. Please try again.');
  }
};

openButtons.forEach((button) => {
  button.addEventListener('click', openModal);
});

closeButtons.forEach((button) => {
  button.addEventListener('click', closeModal);
});

modal?.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeModal();
});

modal?.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

form?.addEventListener('submit', async (event) => {
  event.preventDefault();

  submitButton?.setAttribute('disabled', 'true');
  const result = parseAndValidate();

  if (!result.valid) {
    setStatus(result.error, 'error');
    submitButton?.removeAttribute('disabled');
    return;
  }

  try {
    await sendAppointmentRequest(result.details);
    setStatus('Appointment request sent successfully. We will contact you soon.', 'success');
    form.reset();
  } catch (error) {
    setStatus(error.message || 'Something went wrong while sending your request.', 'error');
  } finally {
    submitButton?.removeAttribute('disabled');
  }
});
