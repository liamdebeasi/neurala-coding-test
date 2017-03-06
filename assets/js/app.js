// Initialize FastClick.js
if ('addEventListener' in document) {
    document.addEventListener('DOMContentLoaded', function() {
        FastClick.attach(document.body);
    }, false);
}

$('#doRegister').click(function(e) {
    
    e.preventDefault();

    var email = $('#email').val();
    var password = $('#password').val();
    var confirmPassword = $('#confirmPassword').val();
    
    if (!email) {
        showAlert("Please enter a valid email");
    } else if (password.length == 0) {
        showAlert("Please enter a password");
    } else if (password != confirmPassword) {
        showAlert("Your passwords do not match");
    } else {

        $.ajax({
            type: "POST",
            url: "/register",
            dataType: 'json',
            contentType: "application/json",
            data: JSON.stringify({
                email: email,
                password: password,
                confirmPassword: confirmPassword
            })
        }).done(function(res) {
             
            if (res.success) {
                hideAlert();    
            } else {
                showAlert(res.message);
            }
        });
    }
    
    return false;
});

$('#doLogin').click(function(e) {
    
    e.preventDefault();

    var email = $('#email').val();
    var password = $('#password').val();
    
    if (!email) {
        showAlert("Please enter a valid email");
    } else if (password.length == 0) {
        showAlert("Please enter a password");
    } else {

        $.ajax({
            type: "POST",
            url: "/login",
            dataType: 'json',
            contentType: "application/json",
            data: JSON.stringify({
                email: email,
                password: password
            })
        }).done(function(res) {
             
            if (res.success) {
                hideAlert();    
            } else {
                showAlert(res.message);
            }
        });
    }
    
    return false;
});

function showAlert(message) {
     $('.alert').html(message).removeClass("hide");
} 


function hideAlert() {
     $('.alert').addClass("hide");
} 
