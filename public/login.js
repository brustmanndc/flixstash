const loginForm = document.getElementById('login-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginMessage = document.getElementById('login-message');

loginForm.addEventListener('submit', async(event) => {
    event.preventDefault();

    const email = loginEmail.value;
    const password = loginPassword.value;
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password:password
            })
        });

        const data = await response.json();
        if(!response.ok) {
            loginMessage.textContent = data.error;
            return;
        }

        localStorage.setItem('token', data.token);
        location.href = '/home.html'
    } catch (error) {
        loginMessage.textContent = 'Verbindung zum Server fehlgeschlagen';
        console.log('Login Fehler:', error)
    }
});