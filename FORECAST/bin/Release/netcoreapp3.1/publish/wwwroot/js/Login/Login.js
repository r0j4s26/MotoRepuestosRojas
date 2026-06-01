$(document).ready(function () {
    jQuery(document).ready(function ($) {
        $(document).ready(function () {

        });
    });
    Recuperar();


});

function Recuperar() {
    try {

        $('#correoElectronico').val(localStorage.email); 
        $('#pwd').val(localStorage.password);
        
        if (localStorage.check == "true") {
            $("#basic_checkbox_1").attr('checked', 'checked');

        }
    } catch (e) {
        alert(e);
    }
}

function onClickLogin() {
    try {
        if ($("#basic_checkbox_1").is(':checked')) {
            localStorage.email = $('#correoElectronico').val();
            localStorage.password = $('#pwd').val(); 
            localStorage.check = true;
        } else {
            localStorage.email = "";
            localStorage.password = ""; 
            localStorage.check = false;

        }
        $("#formTipos").submit();
    } catch (e) {
        alert(e);
    }
}

 