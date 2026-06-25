$(document).ready(function () {
    jQuery(document).ready(function ($) {

        Recuperar();
    });



    $(document).ready(function () {


        // init select 2


    });


});
var Clientes = []; // variables globales
var Productos = [];
var ProdClientes = [];
var Cantones = [];
var Distritos = [];
var Barrios = [];
var ProdCadena = [];
var Documento = [];
var Bodega = [];

var CP = [];
var Duplicado = false;
var BaseEntry = 0;

function formatoDecimal(numero) {
    var number = numero;

    // En el alemán la coma se utiliza como separador decimal y el punto para los millares
    return new Intl.NumberFormat("en-US").format(number);
}
function HideP() {
    try {
        $("#boxP").hide();
        $("#AgregarC").hide();
    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Ha ocurrido un error al intentar recuperar ' + e.stack

        })
    }

}
function ReadOnlyC() {
    try {
        $("#boxC").attr("readonly", "readonly");
        $("#selectCondPago").attr("disabled", "disabled");

        $("#ClienteSeleccionado").attr("disabled", "disabled");


    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Ha ocurrido un error al intentar recuperar ' + e.stack

        })
    }
}
function Recuperar() {
    try {
        Cantones = JSON.parse($("#Cantones").val());
        Distritos = JSON.parse($("#Distritos").val());
        Barrios = JSON.parse($("#Barrios").val());
        Clientes = JSON.parse($("#Clientes").val());

        Productos = JSON.parse($("#Productos").val());
        BaseEntry = JSON.parse($("#BaseEntry").val());


        Documento = JSON.parse($("#Documento").val());

        Bodega = JSON.parse($("#Bodega").val());

        CP = JSON.parse($("#CP").val());



        RellenaClientes();
 

        maskCedula();


        if (Documento != null || Documento != undefined) {
            if (Documento.BaseEntry != 0) {
                RecuperarInformacion();

                HideP();
                ReadOnlyC();
            }
        }
    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Ha ocurrido un error al intentar recuperar ' + e.stack

        })
    }

}

function RecuperarInformacion() {
    try {
        $("#ClienteSeleccionado").val(Documento.idCliente);
        $("#Fecha").val(Documento.Fecha);

        $("#selectMoneda").val(Documento.Moneda);
        $("#selectCondPago").val(Documento.idCondPago);
  


        $("#inputComentarios").val(Documento.Comentarios);
        $("#subG").text(formatoDecimal(Documento.Subtotal.toFixed(2)));
        $("#impG").text(formatoDecimal(Documento.TotalImpuestos.toFixed(2)));
        $("#descG").text(formatoDecimal(Documento.TotalDescuentos.toFixed(2)));
        $("#totG").text(formatoDecimal(Documento.TotalCompra.toFixed(2)));
 

        for (var i = 0; i < Documento.Detalle.length; i++) {
            var PE = Productos.find(a => a.id == Documento.Detalle[i].idProducto);

            var Producto =
            {
                idEncabezado: 0,
                Descripcion: PE.Codigo + " - " + PE.Nombre,
                Moneda: $("#selectMoneda").val(),
                idProducto: PE.id,
                NumLinea: 0,
                Cantidad: parseFloat(Documento.Detalle[i].Cantidad.toFixed(2)),
                TotalImpuesto: parseFloat(Documento.Detalle[i].TotalImpuesto.toFixed(2)),
                PrecioUnitario: parseFloat(Documento.Detalle[i].PrecioUnitario.toFixed(2)),
                PorDescto: parseFloat(Documento.Detalle[i].PorDescto.toFixed(2)),
                Descuento: parseFloat(Documento.Detalle[i].Descuento.toFixed(2)),
                TotalLinea: parseFloat(Documento.Detalle[i].TotalLinea.toFixed(2)),
                Costo: PE.Costo


            };

            ProdCadena.push(Producto);

        }

        RellenaTabla();
        onChangeCliente();
        ValidarStocks();




    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Ha ocurrido un error al intentar recuperar informacion ' + e

        })
    }
}

function RellenaClientes() {
    try {
        var html = "";
        $("#ClienteSeleccionado").html(html);
        html += "<option value='0' > Seleccione Cliente </option>";

        for (var i = 0; i < Clientes.length; i++) {
            html += "<option value='" + Clientes[i].id + "' > " + Clientes[i].id + " - " + Clientes[i].Nombre + " </option>";
        }



        $("#ClienteSeleccionado").html(html);

    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error ' + e

        })
    }

}

function RellenaProductos() {
    try {
        var html = "";
        $("#ProductoSeleccionado").html(html);

        html += "<option value='0' > Seleccione Producto </option>";

        for (var i = 0; i < ProdClientes.length; i++) {
            var Bodegas = Bodega.find(a => a.id == ProdClientes[i].idBodega) == undefined ? undefined : Bodega.find(a => a.id == ProdClientes[i].idBodega);

            html += "<option value='" + ProdClientes[i].id + "' > " + ProdClientes[i].Codigo + " - " + ProdClientes[i].Nombre + " -  Precio: " + formatoDecimal(parseFloat(ProdClientes[i].PrecioUnitario).toFixed(2)) + " -  Stock: " + formatoDecimal(parseFloat(ProdClientes[i].Stock).toFixed(2)) + " -  BOD: " + Bodegas.id + " </option>";
        }



        $("#ProductoSeleccionado").html(html);


    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error ' + e

        })
    }

}

function onChangeCliente() {
    try {
        var idCliente = $("#ClienteSeleccionado").val();
        //  $("#selectCondPago").attr("disabled", "disabled");

        var Cliente = Clientes.find(a => a.id == idCliente);

        var CondP = CP.filter(a => a.id == Cliente.idCondicionPago);

        //Preguntarle a CP cual es la de 30 dias



        $("#spanDireccion").text(Cliente.Sennas);
        $("#strongInfo").text("Phone: " + Cliente.Telefono + " " + "  " + " " + "  " + "Email: " + Cliente.Email);





        ProdClientes = Productos.filter(a => a.Stock > 0);

        if (CondP.length > 0) {
            var Cond30 = CP.filter(a => a.Dias <= CondP[0].Dias).sort(function (a, b) {
                if (a.Dias > b.Dias) {
                    return 1;
                }
                if (a.Dias < b.Dias) {
                    return -1;
                }
                // a must be equal to b
                return 0;
            });
            RellenaCondiciones(Cond30);

        } else {
            var Cond30 = [];
            RellenaCondiciones(Cond30);
        }

        RellenaProductos();

    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Ha ocurrido un error al intentar recuperar cliente ' + e

        })
    }


}


function RellenaCondiciones(CPS) {
    try {
        var idClientes = $("#ClienteSeleccionado").val();
        var Cliente = Clientes.find(a => a.id == idClientes).Nombre;
        var Clientex = Clientes.find(a => a.id == idClientes);
        var valorCondicion = Documento != null || Documento != undefined ? Documento.idCondPago : 0;
        var text = "";
        $("#selectCondPago").html(text);

        var Contado = CP.find(a => a.Nombre == "Contado");


        var CondP = CP.filter(a => a.id == Cliente.idCondicionPago);


        if (Clientex.idCondicionPago == Contado.id) {
            text += "<option value='" + Contado.id + "'> " + Contado.Nombre + " </option>";


        } else {
            text += "<option value='" + Contado.id + "'> " + Contado.Nombre + " </option>";
        }

        for (var i = 0; i < CPS.length; i++) {
            if (CPS[i].id != Contado.id) {

                if (valorCondicion == CPS[i].id) {
                    text += "<option selected value='" + CPS[i].id + "'> " + CPS[i].Nombre + " </option>";
                } else {
                    text += "<option value='" + CPS[i].id + "'> " + CPS[i].Nombre + " </option>";
                }




            }


            $("#selectCondPago").html(text);



        }
    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Ha ocurrido un error al intentar recuperar cliente ' + e

        })
    }
}


function onChangeProducto() {
    try {
        var idProducto = $("#ProductoSeleccionado").val();

        var Producto = ProdClientes.find(a => a.id == idProducto);

        var idCliente = $("#ClienteSeleccionado").val();
        var Cliente = Clientes.find(a => a.id == idCliente);


        if (Producto != undefined) {
            $("#inputPrecio").val(parseFloat(Producto.PrecioUnitario));








            $("#MonedaProducto").val(Producto.Moneda);
        } else {
            $("#cantidad").val(1);

            $("#inputPrecio").val(0);


            $("#descuento").val(0);
        }
    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error ' + e

        })
    }




}

function ModificaSelects(i) {
    try {
        var codProvincia = parseInt($("#selectP").val());
        var codCanton = parseInt($("#selectC").val());
        var codDistrito = parseInt($("#selectD").val());

        if (i == 0) {
            RellenaCantones(Cantones.filter(a => a.CodProvincia == codProvincia));
            RellenaDistritos(Distritos.filter(a => a.CodProvincia == codProvincia && a.CodCanton == codCanton));
            RellenaBarrios(Barrios.filter(a => a.CodProvincia == codProvincia && a.CodCanton == codCanton && a.CodDistrito == codDistrito));

        }

        if (i == 1) {
            RellenaCantones(Cantones.filter(a => a.CodProvincia == codProvincia));
            RellenaDistritos(Distritos.filter(a => a.CodProvincia == codProvincia && a.CodCanton == codCanton));
            RellenaBarrios(Barrios.filter(a => a.CodProvincia == codProvincia && a.CodCanton == codCanton && a.CodDistrito == codDistrito));

        }
        if (i == 2) {

            RellenaDistritos(Distritos.filter(a => a.CodProvincia == codProvincia && a.CodCanton == codCanton));
            RellenaBarrios(Barrios.filter(a => a.CodProvincia == codProvincia && a.CodCanton == codCanton && a.CodDistrito == codDistrito));

        }

        if (i == 3) {
            RellenaBarrios(Barrios.filter(a => a.CodProvincia == codProvincia && a.CodCanton == codCanton && a.CodDistrito == codDistrito));
        }
    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error ' + e

        })
    }


}

function RellenaCantones(ListCantones) {
    try {
        var sOptions = '';

        $("#selectC").html('');

        for (var i = 0; i < ListCantones.length; i++) {

            sOptions += '<option value="' + ListCantones[i].CodCanton + '">' + ListCantones[i].NomCanton + '</option>';

        }
        $("#selectC").html(sOptions);
    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error ' + e

        })
    }

}

function RellenaDistritos(ListDistritos) {
    try {
        var sOptions = '';

        $("#selectD").html('');

        for (var i = 0; i < ListDistritos.length; i++) {

            sOptions += '<option value="' + ListDistritos[i].CodDistrito + '">' + ListDistritos[i].NomDistrito + '</option>';

        }
        $("#selectD").html(sOptions);
    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error ' + e

        })
    }

}

function RellenaBarrios(ListBarrios) {
    try {
        var sOptions = '';

        $("#selectB").html('');

        for (var i = 0; i < ListBarrios.length; i++) {

            sOptions += '<option value="' + ListBarrios[i].CodBarrio + '">' + ListBarrios[i].NomBarrio + '</option>';

        }
        $("#selectB").html(sOptions);
    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error ' + e

        })
    }

}

function AbrirModalAgregarCliente() {
    try {
        $("#ModalAgregarCliente").modal("show");
    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error ' + e

        })
    }

}

function validar(cliente) {
    try {
        if (cliente.Nombre == "" || cliente.Nombre == null) {
            return false;
        }
        else if (cliente.Cedula == "" || cliente.Cedula == null) {
            return false;


        } else if (cliente.Email == "" || cliente.Email == null) {
            return false;

        } else if (cliente.Telefono == "" || cliente.Telefono == null) {
            return false;

        } else if (cliente.Sennas == "" || cliente.Sennas == null) {
            return false;

        }

        else {
            return true;
        }
    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error ' + e

        })
    }

}
function LimpiarDatosCliente() {
    try {

        $("#Nombre").val("");
        $("#selectTP").val("1").trigger('change.select2');
        $("#Cedula").val("");
        $("#Email").val("");
        $("#Telefono").val("");
        $("#selectP").val("1").trigger('change.select2');
        $("#Sennas").val("");

    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error ' + e

        })
    }

}

function AgregarCliente() {
    try {
        var Cliente =
        {
            id: 0,
            Codigo: "",

            Nombre: $("#Nombre").val(),
            TipoCedula: $("#selectTP").val(),
            Cedula: $("#Cedula").val(),
            Email: $("#Email").val(),


            Telefono: $("#Telefono").val(),
            Provincia: $("#selectP").val(),
            Canton: $("#selectC").val(),
            Distrito: $("#selectD").val(),
            Barrio: $("#selectB").val(),
            Sennas: $("#Sennas").val(),

            Activo: true
        };

        if (validar(Cliente)) {
            Swal.fire({
                title: '¿Desea guardar la información de este cliente?',
                showDenyButton: true,
                showCancelButton: false,
                confirmButtonText: `Aceptar`,
                denyButtonText: `Cancelar`,
                customClass: {
                    confirmButton: 'swalBtnColor',
                    denyButton: 'swalDeny'
                },
            }).then((result) => {
                if (result.isConfirmed) {

                    var recibidos = JSON.stringify(Cliente);

                    $.ajax({
                        type: 'POST',

                        url: $("#urlCliente").val(),
                        dataType: 'json',
                        data: { recibidos: Cliente },
                        headers: {
                            RequestVerificationToken: $('input:hidden[name="__RequestVerificationToken"]').val()
                        },
                        success: function (json) {


                            console.log("resultado " + json.cliente);
                            if (json.success == true) {
                                Swal.fire({
                                    title: "Ha sido generado con éxito",

                                    icon: 'success',
                                    showCancelButton: false,

                                    confirmButtonText: 'OK',
                                    customClass: {
                                        confirmButton: 'swalBtnColor',

                                    },
                                }).then((result) => {
                                    if (result.isConfirmed) {
                                        //Despues de insertar, ocupariamos el id del cliente en la bd 
                                        //para entonces setearlo en el array de clientes

                                        LimpiarDatosCliente();
                                        $("#ModalAgregarCliente").modal("hide");

                                        var ClienteInsertar =
                                        {
                                            id: json.cliente.id,


                                            Nombre: json.cliente.nombre,
                                            TipoCedula: json.cliente.tipoCedula,
                                            Cedula: json.cliente.cedula,
                                            Email: json.cliente.email,

                                            Telefono: json.cliente.telefono,
                                            Provincia: json.cliente.provincia,
                                            Canton: json.cliente.canton,
                                            Distrito: json.cliente.distrito,
                                            Barrio: json.cliente.barrio,
                                            Sennas: json.cliente.sennas,

                                            Activo: true
                                        };

                                        Clientes.push(ClienteInsertar);
                                        RellenaClientes();
                                        $("#ClienteSeleccionado").val(json.cliente.id).trigger('change.select2');


                                    }
                                })

                            } else {

                                Swal.fire({
                                    icon: 'error',
                                    title: 'Oops...',
                                    text: 'Ha ocurrido un error al intentar guardar ' + json.cliente

                                })
                            }
                        },

                        beforeSend: function (xhr) {


                        },
                        complete: function () {

                        },
                        error: function (error) {

                            Swal.fire({
                                icon: 'error',
                                title: 'Oops...',
                                text: 'Ha ocurrido un error al intentar guardar ' + error

                            })
                        }
                    });
                }
            })
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Pareciera que aún falta un campo por llenar'

            });
        }



    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Ha ocurrido un error al intentar agregar ' + e

        })
    }
}

function cantidadRepetidos(palabra, separador) {
    try {
        return palabra.split(separador).length - 1;
    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error ' + e

        })
    }


}
function ReplaceLetra(palabra) {
    var cantidad = cantidadRepetidos(palabra, ",");
    for (var i = 0; i < cantidad; i++) {
        palabra = palabra.replace(",", "");
    }

    //var cantidad2 = cantidadRepetidos(palabra, ".");
    //for (var i = 0; i < cantidad2; i++) {
    //    palabra = palabra.replace(".", "");
    //}
    return palabra;
}
function RellenaTabla() {
    try {
        var html = "";
        $("#tbody").html(html);


        for (var i = 0; i < ProdCadena.length; i++) {
            var TotalGanancia = (ProdCadena[i].TotalLinea - ProdCadena[i].TotalImpuesto);
            var MonedaDoc = $("#selectMoneda").val();

            html += "<tr>";

            html += "<td> " + (i + 1) + " </td>";

            html += "<td > " + ProdCadena[i].Descripcion + " </td>";
            html += "<td class='text-center'> " + formatoDecimal(parseFloat(ProdCadena[i].Cantidad).toFixed(2)) + " </td>";
            html += "<td class='text-right'> " + formatoDecimal(parseFloat(ProdCadena[i].PrecioUnitario).toFixed(2)) + " </td>";
            html += "<td class='text-right'> " + formatoDecimal(parseFloat(ProdCadena[i].PorDescto).toFixed(2)) + " </td>";

            html += "<td class='text-right'> " + formatoDecimal(parseFloat(ProdCadena[i].Descuento).toFixed(2)) + " </td>";
            html += "<td class='text-right'> " + formatoDecimal(parseFloat(ProdCadena[i].TotalImpuesto).toFixed(2)) + " </td>";

            html += "<td class='text-right'> " + formatoDecimal(parseFloat(ProdCadena[i].TotalLinea).toFixed(2)) + " </td>";


            html += "<td class='text-center'> <a class='fa fa-trash' onclick='javascript:EliminarProducto(" + i + ") '> </a> </td>";

            html += "</tr>";


        }



        $("#tbody").html(html);
    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error ' + e

        })
    }

}

function AgregarProductoTabla() {
    try {
        var subtotalG = parseFloat(ReplaceLetra($("#subG").text()));
        var impuestoG = parseFloat(ReplaceLetra($("#impG").text()));
        var descuentoG = parseFloat(ReplaceLetra($("#descG").text()));
        var totalG = parseFloat(ReplaceLetra($("#totG").text()));

        var id = $("#ProductoSeleccionado").val();
        var id = $("#ProductoSeleccionado").val();
        var PE = ProdClientes.find(a => a.id == id);



        var Producto =
        {
            idEncabezado: 0,
            Descripcion: PE.Codigo + " - " + PE.Nombre,
            idProducto: PE.id,
            Moneda: $("#selectMoneda").val(),
            NumLinea: 0,
            Cantidad: parseFloat($("#cantidad").val()),
            TotalImpuesto: 0,
            PrecioUnitario: parseFloat($("#inputPrecio").val()),
            PorDescto: parseFloat($("#descuento").val()),
            Descuento: 0,
            TotalLinea: 0,
            Costo: PE.Costo

        };




        for (var i = 0; i < ProdCadena.length; i++) {


            if (PE.id == ProdCadena[i].idProducto) {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Ya se ingreso el mismo producto en otra línea, si necesita mas unidades actualiza la cantidad en la linea ' + ' ' + (ProdCadena[i].NumLinea + 1)

                })
                Duplicado = true;
                return false;
            } else {
                Duplicado = false;
            }
        }

        if (PE.PrecioUnitario > Producto.PrecioUnitario) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Precio invalido, el precio tiene que ser mayor o igual a ' + ' ' + PE.PrecioUnitario

            })



        }

        if (Producto.PrecioUnitario <= 0) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Precio invalido, el precio tiene que ser mayor  a 0'

            })


        }
        if (Producto.Cantidad <= 0) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Cantidad Invalida'

            })

        }
        if (Producto.PorDescto < 0) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Descuento Invalido'

            })

        }
        if ((PE.Stock - Producto.Cantidad) < 0) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Producto sin stock valido'

            })
        }
        else if (Duplicado == false && Producto.Cantidad > 0 && Producto.PorDescto >= 0 && (PE.PrecioUnitario <= Producto.PrecioUnitario)) {




            var IMP = 0;

            var calculoIMP = IMP;

            Producto.Descuento = (Producto.Cantidad * Producto.PrecioUnitario) * (Producto.PorDescto / 100);
            Producto.TotalImpuesto = ((Producto.Cantidad * Producto.PrecioUnitario) - Producto.Descuento) * (calculoIMP / 100);



            Producto.TotalLinea = (Producto.Cantidad * Producto.PrecioUnitario) - Producto.Descuento + Producto.TotalImpuesto;

            subtotalG += (Producto.Cantidad * Producto.PrecioUnitario);
            impuestoG += Producto.TotalImpuesto;
            descuentoG += Producto.Descuento;
            totalG += Producto.TotalLinea;

            $("#subG").text(formatoDecimal(subtotalG.toFixed(2)));
            $("#descG").text(formatoDecimal(descuentoG.toFixed(2)));
            $("#impG").text(formatoDecimal(impuestoG.toFixed(2)));
            $("#totG").text(formatoDecimal(totalG.toFixed(2)));

            ProdCadena.push(Producto);

            RellenaTabla();
            /*     onChangeMoneda();*/

            $("#ProductoSeleccionado").val("0").trigger('change.select2');

        }
    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error: ' + e

        })
    }








}

function EliminarProducto(i) {
    try {
        var Producto = ProdCadena[i];



        var subtotalG = parseFloat(ReplaceLetra($("#subG").text()));
        var impuestoG = parseFloat(ReplaceLetra($("#impG").text()));
        var descuentoG = parseFloat(ReplaceLetra($("#descG").text()));
        var totalG = parseFloat(ReplaceLetra($("#totG").text()));

        subtotalG -= (Producto.Cantidad * Producto.PrecioUnitario);
        impuestoG -= Producto.TotalImpuesto;
        descuentoG -= Producto.Descuento;
        totalG -= Producto.TotalLinea;
        $("#subG").text(formatoDecimal(subtotalG.toFixed(2)));
        $("#descG").text(formatoDecimal(descuentoG.toFixed(2)));
        $("#impG").text(formatoDecimal(impuestoG.toFixed(2)));
        $("#totG").text(formatoDecimal(totalG.toFixed(2)));
        ProdCadena.splice(i, 1);
        RellenaTabla();
    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error ' + e

        })
    }

}

function onChangeDescuentoProducto(i) {
    try {
        ProdCadena[i].PorDescto = parseFloat($("#" + i + "_Prod2").val()).toFixed(2);


        if (ProdCadena[i].PorDescto >= 0) {
            ValidarTotales();
        }

        if (ProdCadena[i].PorDescto < 0) {
            ProdCadena[i].PorDescto = 0;
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Descuento Invalido'

            })

            ValidarTotales();

        }


    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error en: ' + e

        })
    }
}

function onChangePrecioProducto(i) {
    try {

        var PE = ProdClientes.find(a => a.id == ProdCadena[i].idProducto);
        ;
        ProdCadena[i].PrecioUnitario = parseFloat($("#" + i + "_Prod3").val()).toFixed(2);

        if (ProdCadena[i].PrecioUnitario >= PE.PrecioUnitario) {
            ValidarTotales();

        }
        else if (PE.PrecioUnitario > ProdCadena[i].PrecioUnitario) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Precio invalido, el precio tiene que ser mayor o igual a ' + ' ' + PE.PrecioUnitario

            })
            ProdCadena[i].PrecioUnitario = PE.PrecioUnitario;
            ValidarTotales();


        }






    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error en: ' + e

        })
    }
}
function onChangeCantidadProducto(i) {
    try {

        var PE = ProdClientes.find(a => a.id == ProdCadena[i].idProducto);
        ;
        ProdCadena[i].Cantidad = parseFloat($("#" + i + "_Prod").val()).toFixed(2);

        if (ProdCadena[i].Cantidad > 0) {
            ValidarTotales();

        }

        else if (ProdCadena[i].Cantidad <= 0) {
            ProdCadena[i].Cantidad = 1;
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Cantidad Invalida'

            })
            ProdCadena[i].Cantidad = 1;
            ValidarTotales();


        }





    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error en: ' + e

        })
    }
}

function ValidarStocks() {
    try {
        for (var i = 0; i < Documento.Detalle.length; i++) {
            var PE = Productos.find(a => a.id == Documento.Detalle[i].idProducto);

            if ((PE.Stock - ProdCadena[i].Cantidad) < 0) {

                Swal.fire({
                    icon: 'warning',
                    title: 'Oops...',
                    text: 'El producto' + ' ' + ProdCadena[i].Descripcion + ' ' + 'NO tiene' + ' ' + ProdCadena[i].Cantidad + '' + ' unidades en stock, el stock real es de' + ' ' + PE.Stock,

                })
                ProdCadena[i].Cantidad = PE.Stock;

            }




        }
        ValidarTotales();
    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Ha ocurrido un error al intentar recuperar informacion ' + e

        })
    }

}
function ValidarTotales() {
    try {
        var subtotalG = 0;
        var impuestoG = 0;
        var descuentoG = 0;
        var totalG = 0;

        for (var i = 0; i < ProdCadena.length; i++) {
            var idCliente = $("#ClienteSeleccionado").val();
            var Cliente = Clientes.find(a => a.id == idCliente);


            var PE = ProdClientes.find(a => a.id == ProdCadena[i].idProducto);

            var IMP = 0;
            var calculoIMP = IMP;

            ProdCadena[i].Descuento = (ProdCadena[i].Cantidad * ProdCadena[i].PrecioUnitario) * (ProdCadena[i].PorDescto / 100);
            ProdCadena[i].TotalImpuesto = ((ProdCadena[i].Cantidad * ProdCadena[i].PrecioUnitario) - ProdCadena[i].Descuento) * (calculoIMP / 100);

            ProdCadena[i].TotalLinea = (ProdCadena[i].Cantidad * ProdCadena[i].PrecioUnitario) - ProdCadena[i].Descuento + ProdCadena[i].TotalImpuesto;


            subtotalG += (ProdCadena[i].Cantidad * ProdCadena[i].PrecioUnitario);
            impuestoG += ProdCadena[i].TotalImpuesto;
            descuentoG += ProdCadena[i].Descuento;
            totalG += ProdCadena[i].TotalLinea;

        }

        $("#subG").text(formatoDecimal(subtotalG.toFixed(2)));
        $("#descG").text(formatoDecimal(descuentoG.toFixed(2)));
        $("#impG").text(formatoDecimal(impuestoG.toFixed(2)));
        $("#totG").text(formatoDecimal(totalG.toFixed(2)));

        RellenaTabla();
    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error en: ' + e

        })
    }
}

function BuscarCliente() {
    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: 'https://api.hacienda.go.cr/fe/ae?identificacion=' + $("#Cedula").val() + '&fbclid=IwAR02XHHfB7dQycQ1XGVVo8bhyuRZ_jkNgWCZBW5GscL7S18lnG3jQfgeaS8', //Nombre del metodo
        data: {},
        success: function (result) {

            console.log(result);

            if (result.nombre != undefined) {
                $("#Nombre").val(result.nombre);
                $("#selectTP").val(result.tipoIdentificacion);
                $("#Nombre").attr("readonly", "readonly");


            } else {
                $("#Nombre").removeAttr("readonly");
            }



        },
        beforeSend: function () {

        },
        complete: function () {

        }
    });
}

function Generar() {

    try {


        var Documento = {
            id: 0,
            idCliente: $("#ClienteSeleccionado").val(),


            Fecha: $("#Fecha").val(),
            idUsuarioCreador: 0,
            idOferta: Documento == null ? 0 : Documento.idOferta,
            Comentarios: $("#inputComentarios").val(),
            Subtotal: parseFloat(ReplaceLetra($("#subG").text())),
            TotalImpuestos: parseFloat(ReplaceLetra($("#impG").text())),
            TotalDescuentos: parseFloat(ReplaceLetra($("#descG").text())),
            TotalCompra: parseFloat(ReplaceLetra($("#totG").text())),


            Moneda: $("#selectMoneda").val(),
            idCondPago: $("#selectCondPago").val(),
   
            BaseEntry: $("#BaseEntry").val(),

            Detalle: ProdCadena
        }

        if (validarOferta(Documento)) {
            Swal.fire({
                title: '¿Desea guardar el documento?',
                showDenyButton: true,
                showCancelButton: false,
                confirmButtonText: `Aceptar`,
                denyButtonText: `Cancelar`,
                customClass: {
                    confirmButton: 'swalBtnColor',
                    denyButton: 'swalDeny'
                },
            }).then((result) => {
                if (result.isConfirmed) {


                    $.ajax({
                        type: 'POST',

                        url: $("#urlGenerar").val(),
                        dataType: 'json',
                        data: { recibidos: Documento },
                        headers: {
                            RequestVerificationToken: $('input:hidden[name="__RequestVerificationToken"]').val()
                        },
                        success: function (json) {


                            console.log("resultado " + json.documento);
                            if (json.success == true) {
                                $("#divProcesando").modal("hide");
                                Swal.fire({
                                    title: "Ha sido generado con éxito",

                                    icon: 'success',
                                    showCancelButton: false,

                                    confirmButtonText: 'OK',
                                    customClass: {
                                        confirmButton: 'swalBtnColor',

                                    },
                                }).then((result) => {
                                    if (result.isConfirmed) {
                                        //Despues de insertar, ocupariamos el id del cliente en la bd 
                                        //para entonces setearlo en el array de clientes
                                        ImprimirTiquete(json.documento);
                                        window.location.href = window.location.href.split("/Nuevo")[0];


                                    }
                                })

                            } else {

                                Swal.fire({
                                    icon: 'error',
                                    title: 'Oops...',
                                    text: 'Ha ocurrido un error al intentar guardar ' + json.documento

                                })
                            }
                        },

                        beforeSend: function () {
                            $("#divProcesando").modal("show");

                        },
                        complete: function () {
                            $("#divProcesando").modal("hide");

                        },
                        error: function (error) {
                            $("#divProcesando").modal("hide");

                            Swal.fire({
                                icon: 'error',
                                title: 'Oops...',
                                text: 'Ha ocurrido un error al intentar guardar ' + error

                            })
                        }
                    });
                }
            })
        } else {
            $("#divProcesando").modal("hide");

        }

    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Ha ocurrido un error al intentar agregar ' + e

        })
    }



}

function ImprimirTiquete(Documento) {
    try {



        var ventana = window.open('', 'PRINT', 'height=400,width=600');
        var texto = "<!DOCTYPE html> <html> <body> <div style='color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 14pt; margin:0pt; text-indent: 0pt;text-align: left; width: 100%;'> <div style='text-align : center;'> <p style='color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 14pt; line-height: 5px; padding-top: 4pt;text-indent: 0pt;'> Moto Repuestos Rojas</p> <p style=' color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 14pt; line-height: 5px; padding-top: 4pt; text-indent: 0pt;'> Cedula Juridica: 0-00000000</p> <p style=' color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 14pt; line-height: 5px; padding-top: 4pt; text-indent: 0pt;'> Telefax: 72432805</p><a style='color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 14pt; '>motorepuestosrojas1@gmail.com </a>&nbsp;&nbsp;<a style='color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 14pt; '></a> </div> <hr> </hr><a style=' color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 14pt; '>Fecha: </a>&nbsp;&nbsp;<a style=' color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 14pt;'> @Fecha </a><br><a style=' color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 14pt;'>Factura  @NumFactura </a><br>&nbsp;&nbsp;<a style=' color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 14pt;'> </a><br><a style=' color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 14pt;'>N° Interno:<span style='font-weight: bold;'></span><span>@NumInterno</span></a><br><a style=' color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 14pt;'>Cod Cliente:</a><a style=' color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 14pt;'>@CodCliente </a><br><a style=' color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 14pt;'>Cliente:</a><a style=' color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 14pt; font-weight: bold;'>@NombreCliente</a> <hr> </hr> <table style='border-spacing: 10px; text-align: left;'> <thead> <tr> <th>UN </th> <th>PRECIO </th> <th>TOTAL </th> </tr> </thead> <tbody style='text-align: left;'>@Tabla</tbody> </table> <hr> </hr> <table> <tbody> <tr> <td><a style=' color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 14pt;'>SUBTOTAL </a></td> <td></td> <td> <a style=' color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 14pt;'>@SubTotal </a></td> </tr> <tr> <td><a style=' color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 14pt;'>DESCUENTO </a></td> <td> </td> <td><a style=' color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 14pt;'>@TotalDescuento </a></td> </tr> <tr> <td><a style=' color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 14pt;'>IVA </a></td> <td> </td> <td><a style=' color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 14pt;'>@TotalImpuestos </a></td> </tr> <tr> <td><a style=' color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 14pt;'>TOTAL </a></td> <td> </td> <td><a style=' color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 14pt;font-weight: bold;'> @Total</a> </a></td> </tr> </tbody> </table> <hr> </hr><a style=' color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 14pt; font-weight: bold;'>Observaciones:</a><a style=' color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 14pt;'>@Comentario</a> <hr> </hr> <p style=' color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 14pt;'> GRACIAS POR SU COMPRA</p> <hr> </hr> </div> </body> </html>";
        texto = texto.replace("@Fecha", Documento.fecha.split("T")[0] + " " + Documento.fecha.split("T")[1].substring(0, 8));
        texto = texto.replace("@NumInterno", Documento.id);

        texto = texto.replace("@NumFactura", Documento.id);
        texto = texto.replace("@Comentario", Documento.comentarios);



        texto = texto.replace("FACTURA", "TIQUETE");


        var Cli = Clientes.find(a => a.id == Documento.idCliente);
        texto = texto.replace("@CodCliente", " " + Cli.id);


        texto = texto.replace("@NombreCliente", Cli.Nombre);


        var tabla = "";

        for (var i = 0; i < Documento.detalle.length; i++) {

            var Prod = Productos.find(a => a.id == Documento.detalle[i].idProducto);
            var Bod = Bodega.find(a => a.id == Prod.idBodega);

            tabla += "<tr>" + "<td colspan='3'>  " + Prod.Codigo + "-" + Prod.Nombre + " - BOD:" + Bod.id + "  </td></tr>";


            tabla += "<tr>";

            tabla += "<td style='text-align left;'>" + Documento.detalle[i].cantidad + " </td>";

            tabla += "<td style='text-align left;'>" + formatoDecimal(Documento.detalle[i].precioUnitario) + " </td>";
            tabla += "<td style='text-align left;'>" + formatoDecimal(Documento.detalle[i].totalLinea) + " </td>";




            tabla += "</tr>";

        }
        texto = texto.replace("@Tabla", tabla);

        if (Documento.moneda == "CRC") {
            texto = texto.replace("@SubTotal", "₡" + formatoDecimal(Documento.subtotal));
            texto = texto.replace("@TotalDescuento", "₡" + formatoDecimal(Documento.totalDescuentos));
            texto = texto.replace("@TotalImpuestos", "₡" + formatoDecimal(Documento.totalImpuestos));
            texto = texto.replace("@Total", "₡" + formatoDecimal(Documento.totalCompra));
        } else {
            texto = texto.replace("@SubTotal", "$" + formatoDecimal(Documento.subtotal));
            texto = texto.replace("@TotalDescuento", "$" + formatoDecimal(Documento.totalDescuento));
            texto = texto.replace("@TotalImpuestos", "$" + formatoDecimal(Documento.totalImpuestos));
            texto = texto.replace("@Total", "$" + formatoDecimal(Documento.totalCompra));
        }




        ventana.document.write(texto);
        ventana.document.close();
        ventana.focus();
        ventana.print();
        ventana.close();
    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error ' + e

        })
    }
}
//

function validarOferta(e) {
    try {

        var idCliente = $("#ClienteSeleccionado").val();
        var totalG = parseFloat(ReplaceLetra($("#totG").text()));

        var Cliente = Clientes.find(a => a.id == idCliente);





        if (e.idCliente == "0" || e.idCliente == null) {
            return false;
        }
        if (e.idCliente == "0" || e.idCliente == null) {
            return false;
        }
        else if (e.Detalle.length == 0 || e.Detalle == null) {
            return false;
        }



        else {
            return true;
        }


    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Ha ocurrido un error al intentar agregar ' + e

        })
    }



}