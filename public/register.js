const registerForm = document.getElementById('register-form');
const registerUsername = document.getElementById('register-username');
const registerEmail = document.getElementById('register-email');
const registerPassword = document.getElementById('register-pw');
const registerMessage = document.getElementById('register-message');

registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    registerMessage.textContent='Registrierung wird durchgeführt';

    const username = registerUsername.value;
    const email = registerEmail.value;
    const password = registerPassword.value;
    
    try{
        const response = await fetch('/api/register', {
            method:'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if(!response.ok) {
            registerMessage.textContent = data.error;
            return
        }

        registerMessage.textContent = 'Registrierung erfolgreich!'
    } catch(error){
        registerMessage.textContent = 'Verbindung zum Server fehlgeschlagen';
        console.log('Registrierungsfehler:', error);
    }
});