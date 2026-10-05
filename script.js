<script>

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

  const WEB3FORMS_ENDPOINT =
    "https://api.web3forms.com/submit";

  const FORMSPREE_ENDPOINT =
    "YOUR_FORMSPREE_ENDPOINT";

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

    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {

      return crypto.randomUUID();

    }

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

    if (!submitButton) return;

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

    if (!submitButton) return;

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

    if (!formResult) return;

    formResult.textContent = "";

  }


  function showSuccess() {

    if (!formResult) return;

    formResult.textContent =
      "✓ Thank you! Your message has been sent. " +
      "We'll be in touch soon.";

  }


  function showFailure() {

    if (!formResult) return;

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


    if (!response.ok) {

      throw new Error(
        "Web3Forms HTTP error: " +
        response.status
      );

    }


    const result =
      await response.json();


    if (!result.success) {

      throw new Error(
        "Web3Forms rejected submission"
      );

    }


    return true;

  }


  /* =========================================================
     BACKUP SERVICE
     FORMSPREE
  ========================================================= */

  async function sendWithFormspree() {

    if (
      !FORMSPREE_ENDPOINT ||
      FORMSPREE_ENDPOINT ===
        "YOUR_FORMSPREE_ENDPOINT"
    ) {

      throw new Error(
        "Formspree backup endpoint has not been configured."
      );

    }


    const backupData =
      new FormData(contactForm);


    /*
      Web3Forms-specific fields should not
      be sent to Formspree.
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


    const result =
      await response.json();


    /*
      Formspree normally returns JSON when
      Accept: application/json is supplied.
    */

    if (
      result &&
      result.ok === false
    ) {

      throw new Error(
        "Formspree rejected submission"
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

        event.preventDefault();


        /*
          Use the browser's native validation
          before contacting either service.
        */

        if (!contactForm.checkValidity()) {

          contactForm.reportValidity();

          return;

        }


        /*
          Prevent double-click / duplicate
          submissions.
        */

        if (submitButton.disabled) {

          return;

        }


        clearResult();

        setSendingState();


        /*
          Give this submission a unique
          reference number.

          Both providers will receive the
          same ID if fallback is necessary.
        */

        const submissionId =
          createSubmissionId();

        if (submissionIdField) {

          submissionIdField.value =
            submissionId;

        }


        let messageSent = false;


        /* =============================================
           ATTEMPT 1 — WEB3FORMS
        ============================================= */

        try {

          await sendWithWeb3Forms();

          messageSent = true;

          console.info(
            "Contact form delivered using primary service.",
            submissionId
          );

        } catch (primaryError) {

          console.warn(
            "Primary contact service failed.",
            primaryError
          );


          /* ===========================================
             ATTEMPT 2 — FORMSPREE BACKUP
          =========================================== */

          try {

            await sendWithFormspree();

            messageSent = true;

            console.info(
              "Contact form delivered using backup service.",
              submissionId
            );

          } catch (backupError) {

            console.error(
              "Both contact form services failed.",
              backupError
            );

          }

        }


        /* =============================================
           FINAL RESULT
        ============================================= */

        if (messageSent) {

          /*
            Reset form first.
          */

          contactForm.reset();


          /*
            Then display confirmation.
          */

          showSuccess();


          /*
            Create a new reference for the
            visitor's next submission.
          */

          if (submissionIdField) {

            submissionIdField.value = "";

          }

        } else {

          showFailure();

        }


        restoreButton();

      }
    );

  }

</script>
