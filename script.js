/* =========================================================
   GOSPEL LOUNGE
   WEBSITE JAVASCRIPT
========================================================= */


/* =========================================================
   MOBILE NAVIGATION
========================================================= */

const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".main-nav");

if (toggle && nav) {

  toggle.addEventListener("click", () => {

    nav.classList.toggle("active");

    const expanded =
      toggle.getAttribute("aria-expanded") === "true";

    toggle.setAttribute(
      "aria-expanded",
      String(!expanded)
    );

  });


  document.querySelectorAll(".main-nav a").forEach(link => {

    link.addEventListener("click", () => {

      nav.classList.remove("active");

      toggle.setAttribute(
        "aria-expanded",
        "false"
      );

    });

  });

}


/* =========================================================
   CONTACT FORM CONFIGURATION
========================================================= */

/*
  PRIMARY SERVICE:
  Web3Forms

  Your Web3Forms access key remains in index.html.
*/

const WEB3FORMS_ENDPOINT =
  "https://api.web3forms.com/submit";


/*
  BACKUP SERVICE:
  Formspree

  Leave this placeholder for now.
  Once you create your Formspree form,
  replace it with the real endpoint.
*/

const FORMSPREE_ENDPOINT =
  "YOUR_FORMSPREE_ENDPOINT";


/*
  If a provider does not respond within
  8 seconds, stop waiting and continue
  with the fallback process.
*/

const REQUEST_TIMEOUT = 8000;


/* =========================================================
   CONTACT FORM ELEMENTS
========================================================= */

const contactForm =
  document.getElementById("contactForm");

const formResult =
  document.getElementById("formResult");

const submitButton =
  document.getElementById("contactSubmit");

const submissionIdField =
  document.getElementById("submissionId");


/* =========================================================
   CREATE UNIQUE SUBMISSION ID
========================================================= */

function createSubmissionId() {

  /*
    Modern browsers support crypto.randomUUID().
    Use it when available.
  */

  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {

    return crypto.randomUUID();

  }


  /*
    Fallback for browsers that do not
    support crypto.randomUUID().
  */

  return (
    "GL-" +
    Date.now() +
    "-" +
    Math.random()
      .toString(36)
      .substring(2, 10)
  );

}


/* =========================================================
   FETCH WITH TIMEOUT
========================================================= */

async function fetchWithTimeout(
  url,
  options = {},
  timeout = REQUEST_TIMEOUT
) {

  const controller =
    new AbortController();

  const timer =
    setTimeout(() => {

      controller.abort();

    }, timeout);


  try {

    const response =
      await fetch(url, {
        ...options,
        signal: controller.signal
      });

    return response;

  } finally {

    clearTimeout(timer);

  }

}


/* =========================================================
   BUTTON STATES
========================================================= */

function setSendingState() {

  if (!submitButton) {
    return;
  }

  submitButton.disabled = true;

  submitButton.setAttribute(
    "aria-busy",
    "true"
  );

  submitButton.innerHTML =
    '<span class="submit-text">' +
    'Sending...' +
    '</span>';

}


function restoreButton() {

  if (!submitButton) {
    return;
  }

  submitButton.disabled = false;

  submitButton.removeAttribute(
    "aria-busy"
  );

  submitButton.innerHTML =
    '<span class="submit-text">' +
    'Send Message' +
    '</span>' +
    '<span class="submit-arrow">' +
    '→' +
    '</span>';

}


/* =========================================================
   RESULT MESSAGES
========================================================= */

function clearResult() {

  if (!formResult) {
    return;
  }

  formResult.textContent = "";

}


function showSuccess() {

  if (!formResult) {
    return;
  }

  formResult.textContent =
    "✓ Thank you! Your message has been sent. " +
    "We'll be in touch soon.";

}


function showFailure() {

  if (!formResult) {
    return;
  }

  formResult.innerHTML =
    "We couldn't send your message right now. " +
    'Please email us directly at ' +
    '<a href="mailto:gospelloungecanada@gmail.com">' +
    'gospelloungecanada@gmail.com' +
    '</a> or call ' +
    '<a href="tel:+14374210296">' +
    '437-421-0296' +
    '</a>.';

}


/* =========================================================
   PRIMARY SERVICE
   WEB3FORMS
========================================================= */

async function sendWithWeb3Forms() {

  if (!contactForm) {

    throw new Error(
      "Contact form could not be found."
    );

  }


  /*
    Build the form submission.

    This automatically includes:
    - Web3Forms access key
    - Name
    - Email
    - Phone
    - Inquiry Type
    - Message
    - Subject
    - Submission ID
  */

  const primaryData =
    new FormData(contactForm);


  const response =
    await fetchWithTimeout(
      WEB3FORMS_ENDPOINT,
      {
        method: "POST",
        body: primaryData,
        headers: {
          "Accept": "application/json"
        }
      }
    );


  /*
    A non-2xx HTTP response means
    the primary service failed.
  */

  if (!response.ok) {

    throw new Error(
      "Web3Forms HTTP error: " +
      response.status
    );

  }


  const result =
    await response.json();


  /*
    Web3Forms also returns a success
    property in its JSON response.
  */

  if (!result.success) {

    throw new Error(
      result.message ||
      "Web3Forms rejected the submission."
    );

  }


  return true;

}


/* =========================================================
   BACKUP SERVICE
   FORMSPREE
========================================================= */

async function sendWithFormspree() {

  /*
    Until you configure Formspree,
    don't attempt to send anything
    to the placeholder address.
  */

  if (
    !FORMSPREE_ENDPOINT ||
    FORMSPREE_ENDPOINT ===
      "YOUR_FORMSPREE_ENDPOINT"
  ) {

    throw new Error(
      "Formspree backup endpoint has not been configured."
    );

  }


  if (!contactForm) {

    throw new Error(
      "Contact form could not be found."
    );

  }


  const backupData =
    new FormData(contactForm);


  /*
    Remove fields that belong specifically
    to Web3Forms before sending the data
    to Formspree.
  */

  backupData.delete("access_key");
  backupData.delete("botcheck");
  backupData.delete("from_name");


  const response =
    await fetchWithTimeout(
      FORMSPREE_ENDPOINT,
      {
        method: "POST",
        body: backupData,
        headers: {
          "Accept": "application/json"
        }
      }
    );


  if (!response.ok) {

    throw new Error(
      "Formspree HTTP error: " +
      response.status
    );

  }


  /*
    Make sure Formspree returned valid JSON.
  */

  const result =
    await response.json();


  /*
    Formspree may provide an explicit
    error response.
  */

  if (
    result &&
    result.ok === false
  ) {

    throw new Error(
      "Formspree rejected the submission."
    );

  }


  return true;

}


/* =========================================================
   CONTACT FORM SUBMISSION
========================================================= */

if (
  contactForm &&
  submitButton &&
  formResult
) {

  contactForm.addEventListener(
    "submit",
    async function(event) {

      /*
        Prevent the browser from performing
        a traditional page submission.
      */

      event.preventDefault();


      /* =====================================================
         VALIDATE FORM
      ===================================================== */

      if (!contactForm.checkValidity()) {

        contactForm.reportValidity();

        return;

      }


      /* =====================================================
         PREVENT DOUBLE SUBMISSION
      ===================================================== */

      if (submitButton.disabled) {

        return;

      }


      clearResult();

      setSendingState();


      /* =====================================================
         CREATE SUBMISSION REFERENCE
      ===================================================== */

      const submissionId =
        createSubmissionId();


      if (submissionIdField) {

        submissionIdField.value =
          submissionId;

      }


      let messageSent = false;


      /* =====================================================
         ATTEMPT 1
         WEB3FORMS PRIMARY
      ===================================================== */

      try {

        await sendWithWeb3Forms();

        messageSent = true;

        console.info(
          "Gospel Lounge contact form delivered " +
          "using Web3Forms.",
          submissionId
        );

      } catch (primaryError) {

        console.warn(
          "Web3Forms failed. Attempting Formspree backup.",
          primaryError
        );


        /* ===================================================
           ATTEMPT 2
           FORMSPREE BACKUP
        =================================================== */

        try {

          await sendWithFormspree();

          messageSent = true;

          console.info(
            "Gospel Lounge contact form delivered " +
            "using Formspree backup.",
            submissionId
          );

        } catch (backupError) {

          console.error(
            "Both Gospel Lounge contact services failed.",
            backupError
          );

        }

      }


      /* =====================================================
         SUCCESS
      ===================================================== */

      if (messageSent) {

        /*
          Clear the visitor's form.
        */

        contactForm.reset();


        /*
          Show confirmation without
          leaving the Gospel Lounge site.
        */

        showSuccess();


        /*
          Clear the previous submission ID
          so the next message gets a new one.
        */

        if (submissionIdField) {

          submissionIdField.value = "";

        }

      }


      /* =====================================================
         BOTH SERVICES FAILED
      ===================================================== */

      else {

        showFailure();

      }


      /* =====================================================
         RESTORE BUTTON
      ===================================================== */

      restoreButton();

    }
  );

}
