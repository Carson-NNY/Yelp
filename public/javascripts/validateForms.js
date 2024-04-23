// <!-- bootstrap的validation直接提取的代码, 根据自己之前设置的class属性更改document.querySelectorAll(...)的argument -->
// Example starter JavaScript for disabling form submissions if there are invalid fields
(() => {
    'use strict'

    bsCustomFileInput.init() // this is for costum upload file button to display the uploaded file names 

    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const forms = document.querySelectorAll('.validated-form')

    // Loop over them and prevent submission
    Array.from(forms)
        .forEach(form => {
            form.addEventListener('submit', event => {
                if (!form.checkValidity()) {
                    event.preventDefault()
                    event.stopPropagation()
                }

                form.classList.add('was-validated')
            }, false)
        })
})()