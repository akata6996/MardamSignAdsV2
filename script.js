const BUSINESS_EMAIL = 'mardamsignads@gmail.com';
const PHONE_E164 = '639228487611';
const MAX_REFERENCE_SIZE_MB = 10;

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

const formatAppointmentDetails = (details) => {
  return [
    `Name: ${details.name}`,
    `Email: ${details.email}`,
    `Phone: ${details.phone}`,
    `Service Needed: ${details.service}`,
    `Reference File: ${details.referenceFileName || 'No file selected'}`,
    '',
    'Project Description:',
    details.description,
  ].join('\n');
};

const openMailClient = (details) => {
  const subject = encodeURIComponent(
    `Appointment Request - ${details.service || 'General Inquiry'}`
  );
  const body = encodeURIComponent(formatAppointmentDetails(details));
  window.location.href = `mailto:${BUSINESS_EMAIL}?subject=${subject}&body=${body}`;
};

const openWhatsApp = (details) => {
  const whatsappBody = encodeURIComponent(
    `Hello Mardam Sign Ads! I want to request an appointment.\n\n${formatAppointmentDetails(details)}`
  );
  window.open(`https://wa.me/${PHONE_E164}?text=${whatsappBody}`, '_blank', 'noopener');
};

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

form?.addEventListener('submit', (event) => {
  event.preventDefault();

  submitButton?.setAttribute('disabled', 'true');
  const result = parseAndValidate();

  if (!result.valid) {
    setStatus(result.error, 'error');
    submitButton?.removeAttribute('disabled');
    return;
  }

  openMailClient(result.details);
  setStatus('Email draft opened. You can also send this via WhatsApp.', 'success');

  window.setTimeout(() => {
    submitButton?.removeAttribute('disabled');
  }, 400);
});

const whatsappButton = document.getElementById('send-whatsapp');

whatsappButton?.addEventListener('click', () => {
  const result = parseAndValidate();

  if (!result.valid) {
    setStatus(result.error, 'error');
    return;
  }

  openWhatsApp(result.details);
  setStatus('WhatsApp opened in a new tab.', 'success');
});
