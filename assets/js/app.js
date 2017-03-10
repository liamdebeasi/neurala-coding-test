// Initialize FastClick.js
if ('addEventListener' in document) {
    document.addEventListener('DOMContentLoaded', function() {
        FastClick.attach(document.body);
    }, false);
}

$('#doRegister').click(function(e) {
    
    // Prevent form from submitting via POST/GET
    e.preventDefault();

    // Grab form data
    var email = $('#email').val();
    var password = $('#password').val();
    var confirmPassword = $('#confirmPassword').val();
    
    // Do some basic validation
    if (!email || email.indexOf("@") === -1) {
        showAlert("Please enter a valid email");
    } else if (password.length == 0) {
        showAlert("Please enter a password");
    } else if (password != confirmPassword) {
        showAlert("Your passwords do not match");
    } else {
        
        // Do POST request
        // attempt to register user
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
             
            // If successful, notify user
            if (res.success) {
                hideAlert(); 
                window.location = "/dashboard";
            // Otherwise, show error   
            } else {
                showAlert(res.message);
            }
        });
    }
    
    return false;
});
$('#doLogin').click(function(e) {
    
    // Prevent form from submitting via POST/GET
    e.preventDefault();

    // Grab form data
    var email = $('#email').val();
    var password = $('#password').val();
    
    // Do some basic validation
    if (!email || email.indexOf("@") === -1) {
        showAlert("Please enter a valid email");
    } else if (password.length == 0) {
        showAlert("Please enter a password");
    } else {

        // Do POST request
        // attempt to login user
        $.ajax({
            type: "POST",
            url: "/login",
            dataType: 'json',
            contentType: "application/json",
            data: JSON.stringify({
                email: email,
                password: password
            })
        }).error(function(err, res) {
            showAlert("Invalid email or password");
        }).done(function(res) {
             
            // If successful, notify user
            if (res.success) {
                hideAlert();
                window.location = "/dashboard";
            // Otherwise, show error    
            } else {
                showAlert(res.message);
            }
        });
    }
    
    return false;
});

// Increment button count by 1
$('#clickCount').click(function(e) {
    e.preventDefault();

    $.ajax({
        type: "POST",
        url: "/increment",
        dataType: 'json',
        contentType: "application/json",
        data: JSON.stringify({
            id: 10,
        })
    }).done(function(res) {
        console.log(res);
        if (res.success) {
            try {
                var count = parseInt($('#count').text()) + 1;
            } catch(err) {
                var count = 1;
            }
            
            $('#count').text(count);
            $('#clickCount').attr('disabled', 'disabled');
        }
    });
    
    return false;
});

function showAlert(message) {
     $('.alert').html(message).removeClass("hide");
} 

function hideAlert() {
     $('.alert').addClass("hide");
} 
