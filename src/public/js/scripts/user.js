function saveAccessToken(token) {
    localStorage.setItem('access_token', token);
}

function getAccessToken() {
    return localStorage.getItem('access_token');
}

function refreshUI(isLoggedIn) {
    if (isLoggedIn) {
        $('#user-button').html(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 text-gray-600">
                <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clip-rule="evenodd" />
            </svg>
        `);
    } else {
        $('#user-button').html(`
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-gray-600">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
        `);
    }
    return isLoggedIn;
}

function checkLoginState() {
    const token = getAccessToken();
    if (token) {
        return $.ajax({
            url: '/api/@me',
            type: 'GET',
            headers: { Authorization: `Bearer ${token}` },
            success: function () {
                return refreshUI(true);
            },
            error: function () {
                return refreshAccessToken();
            },
        });
    } else {
        return refreshUI(false);
    }
}

function refreshAccessToken() {
    $.ajax({
        url: '/api/auth/refresh',
        type: 'POST',
        success: function (response) {
            if (response.access_token) {
                saveAccessToken(response.access_token);
                return refreshUI(true);
            } else {
                return refreshUI(false);
            }
        },
        error: function () {
            localStorage.removeItem('access_token');
            return refreshUI(false);
        },
    });
}

function handleValidation(
    inputField,
    errorContainer,
    isValid,
    errorMessage = '',
) {
    inputField.toggleClass('shadow-red-500', !isValid);
    errorContainer.text(isValid ? '' : errorMessage);
    checkFormValidity(inputField.closest('form').attr('id'));
}

function validateField(inputId, validationUrl) {
    const inputField = $(`#${inputId}`);
    const errorContainer = $(`#${inputId}-error`);

    function performValidation() {
        const value = inputField.val();

        if (!value) {
            handleValidation(
                inputField,
                errorContainer,
                false,
                'Field Cannot be Empty',
            );
            return;
        }

        $.ajax({
            url: validationUrl,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ [inputField.attr('name')]: value }),
            success: function () {
                handleValidation(inputField, errorContainer, true);
            },
            error: function (xhr) {
                handleValidation(
                    inputField,
                    errorContainer,
                    false,
                    xhr.responseJSON?.error?.message,
                );
            },
        });
    }

    inputField.on('input', performValidation);
    inputField.on('blur', performValidation);
}

function validateNonAjaxField(inputId, customValidation) {
    const inputField = $(`#${inputId}`);
    const errorContainer = $(`#${inputId}-error`);

    function performValidation() {
        const value = inputField.val();
        const { isValid, message } = customValidation(value);
        handleValidation(inputField, errorContainer, isValid, message);
    }

    inputField.on('input', performValidation);
    inputField.on('blur', performValidation);
}

function validateConfirmPassword(confirmId, passwordId) {
    validateNonAjaxField(confirmId, (confirmValue) => {
        const passwordValue = $(`#${passwordId}`).val();

        if (!confirmValue) {
            return { isValid: false, message: 'Field Cannot be Empty' };
        }
        if (confirmValue === passwordValue) {
            return { isValid: true };
        }
        return { isValid: false, message: 'Passwords do NOT match' };
    });
}

function checkFormValidity(formId) {
    const form = $(`#${formId}`);
    const submitButton = form.find('button[type="submit"]');

    const allValid = form
        .find('input')
        .toArray()
        .every((input) => {
            const value = $(input).val();
            return value && !$(input).hasClass('shadow-red-500');
        });

    submitButton.prop('disabled', !allValid);
}

function initUserEvents() {
    validateField('login-username', '/auth/validate/username');
    validateNonAjaxField('login-password', (value) => ({
        isValid: !!value,
        message: 'Password Cannot be Empty',
    }));
    validateField('register-username', '/auth/validate/username');
    validateField('register-password', '/auth/validate/password');
    validateConfirmPassword('register-confirm-password', 'register-password');

    $('.auth-form-toggle').on('click', function (event) {
        event.preventDefault();

        $('#login-form').toggleClass('hidden');
        $('#register-form').toggleClass('hidden');

        if (!$('#login-form').hasClass('hidden')) {
            $('#auth-form-title').text('Welcome Back!');
            $('.auth-form-toggle').text('Register');
            $('#register-password').val('');
            $('#register-confirm-password').val('');
        } else {
            $('#auth-form-title').text('Create an Account');
            $('.auth-form-toggle').text('Login');
            $('#login-password').val('');
        }
    });
}

export { checkLoginState, initUserEvents, refreshUI, saveAccessToken };
