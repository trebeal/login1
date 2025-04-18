document.getElementById('facebook-register-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Obtener valores del formulario
    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    const day = document.getElementById('birth-day').value;
    const month = document.getElementById('birth-month').value;
    const year = document.getElementById('birth-year').value;
    const gender = document.querySelector('input[name="gender"]:checked').value;
    const emailPhone = document.getElementById('email-phone').value;
    const password = document.getElementById('password').value;
  
    // Validación básica
    if (!firstName || !lastName || !day || !month || !year || !gender || !emailPhone || !password) {
      alert('Por favor completa todos los campos');
      return;
    }
  
    // Aquí iría la lógica para registrar al usuario
    // Por ejemplo, con Firebase:
    /*
    firebase.auth().createUserWithEmailAndPassword(emailPhone, password)
      .then((userCredential) => {
        // Guardar información adicional en Firestore
        return db.collection('users').doc(userCredential.user.uid).set({
          firstName,
          lastName,
          birthday: `${day}/${month}/${year}`,
          gender,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      })
      .then(() => {
        alert('¡Registro exitoso!');
        window.location.href = 'index.html';
      })
      .catch((error) => {
        alert('Error: ' + error.message);
      });
    */
  
    // Para este ejemplo, solo mostramos los datos
    console.log({
      firstName,
      lastName,
      birthday: `${day}/${month}/${year}`,
      gender,
      emailPhone,
      password
    });
  
    alert('Formulario enviado (simulación)');
  });

  document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('facebook-register-form');
    const inputs = form.querySelectorAll('input, select');
    
    // Validación al perder el foco
    inputs.forEach(input => {
      input.addEventListener('blur', function() {
        validateField(this);
      });
    });
  
    // Validación personalizada
    function validateField(field) {
      const group = field.closest('.input-group');
      
      if (field.required && !field.value) {
        group.classList.add('error');
      } else {
        group.classList.remove('error');
      }
    }
  
    // Validación al enviar
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      let isValid = true;
  
      inputs.forEach(input => {
        validateField(input);
        if (input.required && !input.value) {
          isValid = false;
        }
      });
  
      if (isValid) {
        // Lógica de registro...
        alert('Formulario válido, procesando registro...');
      }
    });
  });