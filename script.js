const form = document.getElementById('appointmentForm');
const formMessage = document.getElementById('formMessage');
const year = document.getElementById('year');

year.textContent = new Date().getFullYear();

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  formMessage.className = 'form-message';

  if (!form.checkValidity()) {
    formMessage.textContent = 'Please complete all required fields correctly before submitting.';
    formMessage.classList.add('error');
    form.reportValidity();
    return;
  }

  const formData = new FormData(form);

  try {
    const response = await fetch(form.action, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Submission failed');
    }

    form.reset();
    formMessage.textContent = 'Thank you! Your appointment request has been sent. Our team will contact you shortly.';
    formMessage.classList.add('success');
  } catch (error) {
    formMessage.textContent = 'Unable to send your request at the moment. Please call us directly using the contact numbers above.';
    formMessage.classList.add('error');
  }
});
