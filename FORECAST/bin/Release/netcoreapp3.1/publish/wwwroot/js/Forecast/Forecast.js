$(document).ready(function () {

    $('body').toggleClass('toggled');
    $('.select2').select2();

    Recuperar();
});



// variables globales
var ProdClientes = [];
var ProdClientesBase = [];
var ProdCadena = [];
var Presupuestos = [];
var Productos = [];
var Marcas = [];
var Grupos = [];
var Ingredientes = [];
var Clientes = [];
var Forecast = [];
var Ventas = [];
var Vendedores = [];
var Precios = [];
var Aprobaciones = [];
let debounceTimers = {};
var Inicio = true;
var rolVerCostoBGT = false;
var rolVerPrecioBGT = false;
var rolEditCostoBGT = false;
var rolEditPrecioBGT = false;
let cacheForecast = {};
let mapaPrecios = {};
let modoActual = "units"; // units | kg | usd | 15
let paginaActual = 1;
let filasPorPagina = 20;
var searchTexto = "";
var Sucursales = [];
const MESES = [
    "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
    "JULIO", "AGOSTO", "SETIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
];
var ordenTabla = {
    columna: "",
    direccion: "asc"
};
var rolEditarMesesBloqueados = false;
var rolEditarForecast = false;

// Expand / collapse de las filas de detalle SIN Bootstrap Collapse
function obtenerMesesBloqueoSucursal() {
    try {
        let idSucursal = parseInt($("#SucursalSeleccionada").val()) || 0;
        let sucursal = Sucursales.find(s => parseInt(s.id) === idSucursal);

        return parseInt(sucursal?.MesesBloqueo || 0) || 0;
    } catch (e) {
        console.error("Error obteniendo MesesBloqueo de sucursal:", e);
        return 0;
    }
}
function Recuperar() {
    try {

        Presupuestos = JSON.parse($("#Presupuestos").val());
        Productos = JSON.parse($("#Productos").val());
        Marcas = JSON.parse($("#Marcas").val());
        Grupos = JSON.parse($("#Grupos").val());
        Ingredientes = JSON.parse($("#Ingredientes").val());
        Sucursales = JSON.parse($("#Sucursales").val());
        Clientes = JSON.parse($("#Clientes").val());
        //Forecast = JSON.parse($("#Forecast").val());
        Ventas = JSON.parse($("#Ventas").val());
        Vendedores = JSON.parse($("#Vendedores").val());
        Precios = JSON.parse($("#Precios").val());
        Aprobaciones = JSON.parse($("#Aprobaciones").val());
        rolVerCostoBGT = $("#rolVerCostoBGT").val() === "true";
        rolVerPrecioBGT = $("#rolVerPrecioBGT").val() === "true";
        rolEditCostoBGT = $("#rolEditCostoBGT").val() === "true";
        rolEditPrecioBGT = $("#rolEditPrecioBGT").val() === "true"
        rolEditarMesesBloqueados = ($("#RolEditarMesesBloqueados").val() || "").toLowerCase() === "true";
        rolEditarForecast = ($("#RolEditarForecast").val() || "").toLowerCase() === "true";
        RellenaPresupuestos();

        RellenaVendedores();

        // RecuperarInformacion();


        setDefaultForecast();
        onChangeVendedor();
        // RellenaProductos();
        //RellenaMarcas();
        //RellenaGrupos();
        //RellenaIngredientes();
        //    RellenaClientes();

    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Ha ocurrido un error al intentar recuperar ' + e.stack

        })
    }

}
function setDefaultForecast() {
    try {

        const hoy = new Date();

        function getFechaDesdeCodigo(codigo) {
            try {
                let mesStr = codigo.substring(3, 6).toUpperCase();
                let yearStr = codigo.substring(6, 8);

                const meses = {
                    JAN: 1, FEB: 2, MAR: 3, APR: 4,
                    MAY: 5, JUN: 6, JUL: 7, AUG: 8,
                    SEP: 9, OCT: 10, NOV: 11, DEC: 12
                };

                let mes = meses[mesStr];
                if (!mes) return null;

                let year = 2000 + parseInt(yearStr);

                return new Date(year, mes - 1);
            } catch {
                return null;
            }
        }

        let mejor = null;
        let mejorFecha = null;

        Presupuestos.forEach(p => {

            let fecha = getFechaDesdeCodigo(p.Codigo || "");
            if (!fecha) return;

            // 🔥 SOLO fechas <= HOY
            if (fecha <= hoy) {

                if (!mejorFecha || fecha > mejorFecha) {
                    mejor = p;
                    mejorFecha = fecha;
                }
            }
        });

        // 🔥 si no hay ninguna hacia atrás (raro)
        if (!mejor && Presupuestos.length > 0) {
            Presupuestos.sort((a, b) =>
                getFechaDesdeCodigo(a.Codigo) - getFechaDesdeCodigo(b.Codigo)
            );

            mejor = Presupuestos[0]; // el más viejo
        }

        if (mejor) {
            $("#PresupuestoSeleccionado")
                .val(mejor.id)
                .trigger("change");
        }

    } catch (e) {
        console.error("Error setDefaultForecast:", e);
    }
}
async function cargarForecast(idPresupuesto) {
    try {

        let vendedor = parseInt($("#VendedorSeleccionado").val()) || 0;
        let sucursal = parseInt($("#SucursalSeleccionada").val()) || 0;

        console.log("DEBUG →", { idPresupuesto, vendedor, sucursal });

        if (!sucursal) {
            Swal.fire({
                icon: 'warning',
                title: 'Seleccione sucursal',
                text: 'Debe seleccionar una sucursal antes de cargar'
            });
            return;
        }

        let cacheKey = `${idPresupuesto}_${vendedor}_${sucursal}`;

        // 🔥 CACHE
        if (cacheForecast[cacheKey]) {

            Forecast = cacheForecast[cacheKey].forecast;
            Precios = cacheForecast[cacheKey].precios;
            Ventas = cacheForecast[cacheKey].ventas;

        } else {

            Swal.fire({
                title: 'Cargando forecast...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            let response = await fetch(`?handler=ForecastCompleto&id=${idPresupuesto}&idVendedor=${vendedor}&idSucursal=${sucursal}`);

            // 🔥 DEBUG RESPUESTA
            let text = await response.text();
            console.log("RESPUESTA RAW:", text);

            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                Swal.close();
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'La respuesta no es JSON válido (revisa consola)'
                });
                return;
            }

            console.log("JSON:", data);

            if (!data || !data.forecast || data.forecast.length === 0) {
                Swal.close();
                Swal.fire({
                    icon: 'warning',
                    title: 'Sin datos',
                    text: 'No hay información para mostrar (revisa filtros)'
                });
                return;
            }

            // 🔥 ASIGNAR DATA
            Forecast = data.forecast;
            Precios = data.precios;
            Ventas = data.ventas;

            // 🔥 CACHE
            cacheForecast[cacheKey] = {
                forecast: Forecast,
                precios: Precios,
                ventas: Ventas
            };

            Swal.close();
        }
        await cargarUltimoForecastCerradoParaBudgetEnMemoria(idPresupuesto, vendedor, sucursal);

        // 🔥 LIMPIAR
        ProdCadena = [];
        ProdClientes = [];

        // 🔥 MAPA PRECIOS
        mapaPrecios = {};
        Precios.forEach(p => {
            mapaPrecios[`${p.idProducto}_${p.idCliente}_${p.idPresupuesto}`] = p;
            mapaPrecios[`${p.idProducto}_${p.idCliente}`] = p;
        });

        // 🔥 RECONSTRUIR
        RecuperarInformacion();
        CalcularKPIS();


    } catch (e) {
        console.error(e);
        Swal.fire({
            icon: 'error',
            title: 'Error cargando forecast',
            text: e
        });
    }
}
async function cargarUltimoForecastCerradoParaBudgetEnMemoria(idPresupuesto, vendedor, sucursal) {
    try {
        let presupuestoSel = Presupuestos.find(p => p.id == idPresupuesto);
        if (presupuestoSel?.Tipo != "B") return;

        let hoy = new Date();
        let ultimoMesCerrado = hoy.getMonth(); // Mayo => 4, o sea abril cerrado.
        let yearCerrado = hoy.getFullYear();

        if (ultimoMesCerrado === 0) {
            ultimoMesCerrado = 12;
            yearCerrado -= 1;
        }

        let presupuestoFCTCerrado = null;

        Presupuestos.forEach(p => {
            if (
                p.Tipo == "F" &&
                parseInt(p.Year) === yearCerrado &&
                parseInt(p.Mes) === ultimoMesCerrado &&
                (!presupuestoFCTCerrado || parseInt(p.id || 0) > parseInt(presupuestoFCTCerrado.id || 0))
            ) {
                presupuestoFCTCerrado = p;
            }
        });

        if (!presupuestoFCTCerrado) return;

        let cacheKey = `${presupuestoFCTCerrado.id}_${vendedor}_${sucursal}`;
        let data = cacheForecast[cacheKey];

        if (!data) {
            let response = await fetch(`?handler=ForecastCompleto&id=${presupuestoFCTCerrado.id}&idVendedor=${vendedor}&idSucursal=${sucursal}`);
            data = await response.json();

            data = {
                forecast: data.forecast || [],
                precios: data.precios || [],
                ventas: data.ventas || []
            };

            cacheForecast[cacheKey] = data;
        }

        let forecastExtra = data.forecast || [];
        let preciosExtra = data.precios || [];

        let forecastIds = new Set(Forecast.map(x => x.id));
        let precioIds = new Set(Precios.map(x => x.id));

        forecastExtra.forEach(f => {
            if (!forecastIds.has(f.id)) {
                Forecast.push(f);
                forecastIds.add(f.id);
            }
        });

        preciosExtra.forEach(p => {
            if (!precioIds.has(p.id)) {
                Precios.push(p);
                precioIds.add(p.id);
            }
        });

    } catch (e) {
        console.error("Error cargando último forecast cerrado para BGT:", e);
    }
}
function onChangeFiltroInterno() {
    try {

        var ForecastSel = $("#PresupuestoSeleccionado").val();
        var Cliente = $("#ClienteSeleccionado").val();
        var Producto = $("#ProductoSeleccionado").val();
        var Grupo = $("#GrupoSeleccionado").val();
        var Ingrediente = $("#IngredienteSeleccionado").val();
        var Vendedor = $("#VendedorSeleccionado").val();

        let filters = [];

        if (ForecastSel != 0) {
            filters.push(a => a.idPresupuesto == ForecastSel);

            var MiPresupuesto = Presupuestos.find(a => a.id == ForecastSel);

            $("#presupuestoREAL").text("REAL + " + MiPresupuesto.Codigo);
    /*        $("#presupuestoKPI").text(MiPresupuesto.Codigo);*/
        }

        if (Producto != 0) filters.push(a => a.idProducto == Producto);
        if (Grupo != 0) filters.push(a => a.idGrupo == Grupo);
        if (Ingrediente != 0) filters.push(a => a.idIngrediente == Ingrediente);
        if (Vendedor != 0) filters.push(a => a.idVendedor == Vendedor);
        if (Cliente != 0) filters.push(a => a.idCliente == Cliente);

        ProdClientes = ProdCadena.filter(a => filters.every(f => f(a)));
        ProdClientesBase = [...ProdClientes];

        RellenaTabla();

    } catch (e) {
        console.error(e);
    }
}
function RecuperarInformacion() {
    try {




        for (var i = 0; i < Forecast.length; i++) {

            let keyFull = `${Forecast[i].idProducto}_${Forecast[i].idCliente}_${Forecast[i].idPresupuesto}`;
            let keyBase = `${Forecast[i].idProducto}_${Forecast[i].idCliente}`;

            var PrecioProducto = mapaPrecios[keyFull] || mapaPrecios[keyBase];

            let precioFinal = PrecioProducto?.Precio;

            // 🔥 SOLO si no existe o es 0 → fallback
            if (!precioFinal || precioFinal == 0) {

                let pc = obtenerPrecioYCosto({
                    idProducto: Forecast[i].idProducto,
                    idCliente: Forecast[i].idCliente,
                    idPresupuesto: Forecast[i].idPresupuesto
                });

                precioFinal = pc.Precio;
            }
            var PE = Productos.find(a => a.id == Forecast[i].idProducto);
            var Producto = {

                id: Forecast[i].id,
                idPresupuesto: Forecast[i].idPresupuesto,
                idCliente: Forecast[i].idCliente,
                idProducto: Forecast[i].idProducto,
                idVendedor: Forecast[i].idVendedor,
                idBudget: Forecast[i].idBudget,
                idSucursal: Forecast[i].idSucursal,

                CodigoCliente: Forecast[i].CodigoCliente,
                CodigoProducto: Forecast[i].CodigoProducto,
                NombreCliente: Forecast[i].NombreCliente,
                NombreProducto: PE.Codigo + "-" + PE.Nombre + " PRECIO $" + parseFloat((PrecioProducto?.Precio && PrecioProducto.Precio != 0 ? PrecioProducto.Precio : obtenerPrecioYCosto({ idProducto: Forecast[i].idProducto, idCliente: Forecast[i].idCliente, idPresupuesto: Forecast[i].idPresupuesto }).Precio) || 0).toFixed(2),

                Year: Forecast[i].Year,
                MES: Forecast[i].MES,

                ENERO_CANT: parseFloat(Forecast[i].ENERO_CANT) || 0,
                FEBRERO_CANT: parseFloat(Forecast[i].FEBRERO_CANT) || 0,
                MARZO_CANT: parseFloat(Forecast[i].MARZO_CANT) || 0,
                ABRIL_CANT: parseFloat(Forecast[i].ABRIL_CANT) || 0,
                MAYO_CANT: parseFloat(Forecast[i].MAYO_CANT) || 0,
                JUNIO_CANT: parseFloat(Forecast[i].JUNIO_CANT) || 0,
                JULIO_CANT: parseFloat(Forecast[i].JULIO_CANT) || 0,
                AGOSTO_CANT: parseFloat(Forecast[i].AGOSTO_CANT) || 0,
                SETIEMBRE_CANT: parseFloat(Forecast[i].SETIEMBRE_CANT) || 0,
                OCTUBRE_CANT: parseFloat(Forecast[i].OCTUBRE_CANT) || 0,
                NOVIEMBRE_CANT: parseFloat(Forecast[i].NOVIEMBRE_CANT) || 0,
                DICIEMBRE_CANT: parseFloat(Forecast[i].DICIEMBRE_CANT) || 0,

                PRECIO: Forecast[i].PRECIO == null ? null : parseFloat(Forecast[i].PRECIO),
                COSTO: Forecast[i].COSTO == null ? null : parseFloat(Forecast[i].COSTO),

                CLASIFICACION_1: Forecast[i].CLASIFICACION_1,
                CLASIFICACION_2: Forecast[i].CLASIFICACION_2,
                CLASIFICACION_3: Forecast[i].CLASIFICACION_3,

                DESIGUAL_DEC: Forecast[i].DESIGUAL_DEC == null ? null : parseFloat(Forecast[i].DESIGUAL_DEC),
                DESIGUAL: Forecast[i].DESIGUAL,

                COSTO_BGT: Forecast[i].COSTO_BGT == null ? null : parseFloat(Forecast[i].COSTO_BGT),
                PRECIO_BGT: Forecast[i].PRECIO_BGT == null ? null : parseFloat(Forecast[i].PRECIO_BGT),
                COSTO_FACT: Forecast[i].COSTO_FACT == null ? null : parseFloat(Forecast[i].COSTO_FACT),
                PRECIO_FACT: Forecast[i].PRECIO_FACT == null ? null : parseFloat(Forecast[i].PRECIO_FACT),
                Precio: (PrecioProducto?.Precio && PrecioProducto.Precio != 0 ? PrecioProducto.Precio : obtenerPrecioYCosto({ idProducto: Forecast[i].idProducto, idCliente: Forecast[i].idCliente, idPresupuesto: Forecast[i].idPresupuesto }).Precio),
                Costo: (PrecioProducto?.Costo && PrecioProducto.Costo != 0 ? PrecioProducto.Costo : obtenerPrecioYCosto({ idProducto: Forecast[i].idProducto, idCliente: Forecast[i].idCliente, idPresupuesto: Forecast[i].idPresupuesto }).Costo),
                Venta: 0,
                Factor: PE.Factor,
                Total: Forecast[i].Total,
                Variacion: 0,
                Revisado: Forecast[i].Revisado,

                idMarca: PE?.idMarca ?? 0,
                idGrupo: PE?.idGrupo ?? 0,
                idIngrediente: PE?.idIngrediente ?? 0,

            };

            ProdCadena.push(Producto);



        }



    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Ha ocurrido un error al intentar imprimir ' + e

        })
    }
}
function MesDebeIrDisabled(mesNumero) {
    try {
        var idPresupuesto = $("#PresupuestoSeleccionado").val();
        var idVendedor = $("#VendedorSeleccionado").val();

        var MiPresupuesto = Presupuestos.find(a => a.id == idPresupuesto);
        if (!MiPresupuesto) return true;

        if (!rolEditarForecast) {
            return true;
        }

        var MiAprobacion = Aprobaciones.find(a =>
            a.idPresupuesto == idPresupuesto &&
            a.idVendedor == idVendedor &&
            (a.AprobadoVendedor == "A" ||
                a.AprobadoCountry == "A" ||
                a.AprobadoAdmin == "A")
        );

        if (MiPresupuesto.Tipo == "B" && MiAprobacion == undefined) {
            return false;
        }

        if (MiAprobacion != undefined) {
            return true;
        }

        var mesForecast = parseInt(MiPresupuesto.Mes);
        var mesesBloqueo = obtenerMesesBloqueoSucursal();

        // Siempre bloquea meses anteriores al forecast.
        // Ej: FCTAPR26 bloquea ENE, FEB, MAR.
        if (mesNumero < mesForecast) {
            return true;
        }

        // Bloqueo por sucursal desde el mes forecast hacia adelante.
        // Ej: APR + 2 bloquea ABR y MAY.
        // Si tiene rol, puede editar SOLO este bloque.
        if (!rolEditarMesesBloqueados && mesNumero < mesForecast + mesesBloqueo) {
            return true;
        }

        return false;

    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Ha ocurrido un error ' + e
        });
    }
}
function obtenerDataSegunModo() {
    try {

        // 🔥 evitar duplicados reales
        let vistos = new Set();

        let data = ProdClientes.filter(x => {

            let key = x.idCliente + "_" + x.idProducto;

            if (vistos.has(key)) return false;

            vistos.add(key);
            return true;
        }).map(copia => {

            let totalActual = calcularTotalAnual(copia);

            let anterior = ProdCadena.find(y =>
                y.idCliente == copia.idCliente &&
                y.idProducto == copia.idProducto &&
                (
                    (parseInt(y.Year) === parseInt(copia.Year) && parseInt(y.MES) === parseInt(copia.MES) - 1) ||
                    (parseInt(copia.MES) === 1 && parseInt(y.Year) === parseInt(copia.Year) - 1 && parseInt(y.MES) === 12)
                )
            );

            let totalAnterior = anterior ? calcularTotalAnual(anterior) : 0;

            copia.Variacion = totalAnterior > 0
                ? ((totalActual - totalAnterior) / totalAnterior) * 100
                : 0;

            return copia;
        });

        // 🔥 UNEQUAL
        if (modoActual === "15") {
            data = data.filter(a => Math.abs(a.Variacion) >= 15);
        }

        return data;

    } catch (e) {
        console.error(e);
        return [];
    }
}
function cambiarModo(modo) {
    modoActual = modo;
    paginaActual = 1; // 🔥 ESTO TE FALTABA
    RellenaTabla();
}
function toggleDetalle(idx) {

    let rows = $(`tr.detail-row[data-parent='${idx}']`);

    let visible = rows.first().is(":visible");

    if (visible) {
        rows.hide();
    } else {
        rows.show();
    }

}
function obtenerFilaBasePorIndexTabla(indexFila) {
    try {
        let idxReal = parseInt($(`tr.main-row[data-row='${indexFila}']`).attr("data-idxreal"));

        if (!isNaN(idxReal) && ProdCadena[idxReal]) {
            return ProdCadena[idxReal];
        }

        return ProdCadena[indexFila] || null;
    } catch (e) {
        console.error(e);
        return ProdCadena[indexFila] || null;
    }
}
function obtenerBudgetLinea(p, presupuestoBGT) {
    try {
        if (!p || !presupuestoBGT) return null;

        return ProdCadena.find(x =>
            x.idPresupuesto == presupuestoBGT.id &&
            x.idCliente == p.idCliente &&
            x.idProducto == p.idProducto &&
            x.idVendedor == p.idVendedor &&
            x.idSucursal == p.idSucursal
        ) || null;

    } catch (e) {
        console.error("Error obtenerBudgetLinea:", e);
        return null;
    }
}
function RellenaTabla() {
    try {
        var html = "";
        $("#tbody").html("");

        var idPresupuestoSel = $("#PresupuestoSeleccionado").val();
        var presupuestoSel = Presupuestos.find(a => a.id == idPresupuestoSel);
        var presupuestoBGT = null;

        if (presupuestoSel) {
            presupuestoBGT = Presupuestos.find(a =>
                a.Tipo == "B" &&
                a.Year == presupuestoSel.Year
            );
        }

        const Anios = obtenerAniosProyectados();

        // 🔥 Calcular variación UNA sola vez
        ProdClientes.forEach(p => {
            let totalActual = calcularTotalAnual(p);

            let anterior = ProdCadena.find(x =>
                x.idCliente == p.idCliente &&
                x.idProducto == p.idProducto &&
                (
                    (parseInt(x.Year) === parseInt(p.Year) && parseInt(x.MES) === parseInt(p.MES) - 1) ||
                    (parseInt(p.MES) === 1 && parseInt(x.Year) === parseInt(p.Year) - 1 && parseInt(x.MES) === 12)
                )
            );

            let totalAnterior = anterior ? calcularTotalAnual(anterior) : 0;

            p.Variacion = totalAnterior > 0
                ? ((totalActual - totalAnterior) / totalAnterior) * 100
                : 0;
        });

        let dataBase = obtenerDataSegunModo();
        let dataFiltrada = aplicarModoADatos(dataBase);
        if (searchTexto && searchTexto.trim() !== "") {

            dataFiltrada = dataFiltrada.filter(a => {

                let texto =
                    (a.NombreCliente || "") + " " +
                    (a.NombreProducto || "") + " " +
                    (a.CodigoCliente || "") + " " +
                    (a.CodigoProducto || "");

                return texto.toLowerCase().includes(searchTexto);
            });
        }

        dataFiltrada = dataFiltrada.map(p => {
            let varVsBGTLinea = calcularVarVsBGTLinea(p);

            return {
                ...p,
                VariacionBGT: varVsBGTLinea.Porcentaje || 0
            };
        });

        dataFiltrada = aplicarOrdenTabla(dataFiltrada);

        let totalPaginas = Math.ceil(dataFiltrada.length / filasPorPagina) || 1;
        if (paginaActual > totalPaginas) paginaActual = totalPaginas;

        let inicio = (paginaActual - 1) * filasPorPagina;
        let fin = inicio + filasPorPagina;
        let dataPagina = dataFiltrada.slice(inicio, fin);

        for (var i = 0; i < dataPagina.length; i++) {

            let realIndex = inicio + i;
            var p = dataPagina[i];
            let lineaReal = ProdCadena.find(x =>
                x.id == p.id
            );
            let idxReal = ProdCadena.findIndex(x =>
                x.idPresupuesto == p.idPresupuesto &&
                x.idCliente == p.idCliente &&
                x.idProducto == p.idProducto &&
                x.Year == p.Year &&
                x.MES == p.MES
            );

            let estiloRevisado = ProdCadena[idxReal].Revisado ? "revisado-row" : "";

            html += `<tr class='align-middle main-row ${estiloRevisado}'
                        data-row='${realIndex}'
                        data-idxreal="${idxReal}"
                        data-idcli='${p.idCliente}'
                        data-idprod='${p.idProducto}'
                        data-year='${p.Year}'
                        data-mes='${p.MES}'>`;

            // Cliente
            html += `
                <td>
                    <div class='d-flex align-items-start'>
                        <div class='me-2 expand-icon'
     data-row='${realIndex}'
     onclick="toggleDetalle(${realIndex})"
     style="cursor:pointer;">
    <i class='fa-solid fa-chevron-right'></i>
</div>
                        <div>
                            <div class='customer-name'>${p.NombreCliente}</div>
                            <div class='small-muted'>${p.CodigoCliente}</div>
                        </div>
                    </div>
                </td>`;

            html += `<td>${p.NombreProducto}</td>`;

            // Meses
            MESES.forEach((mes, idx) => {

                let numMes = idx + 1;

                let cantidad = parseFloat(p[mes + "_CANT"] || 0);
                let valor = cantidad;

                if (modoActual === "kg") {
                    valor = cantidad * (p.Factor || 1);
                }
                else if (modoActual === "usd") {
                    valor = cantidad * (p.Precio || 0);
                }

                html += `
        <td class='text-center'>
            <input 
                id="${realIndex}_${mes}"
                class="month-input"
           ${((modoActual !== "units" && modoActual !== "15") || MesDebeIrDisabled(numMes)) ? "disabled" : ""}
                value="${modoActual === "usd"
                        ? "$" + formatoDecimal(valor.toFixed(0))
                        : formatearNumero(valor)}"
                data-raw="${cantidad}"
                oninput="onChangeCantidad(${realIndex})"
            />
        </td>`;
            });

            // 🔥 TOTAL (modo correcto)
            let total = calcularTotalAnual(p);
            let totalMostrar = total;

            if (modoActual === "kg") {
                totalMostrar = total * (p.Factor || 1);
            }
            else if (modoActual === "usd") {
                totalMostrar = total * (p.Precio || 0);
            }

            html += `<td class='text-center'> <strong class='row-total'> ${modoActual === "usd" ? "$" + formatoDecimal(totalMostrar.toFixed(0)) : formatearNumero(totalMostrar)} </strong></td>`;

            // Variación (YA calculada)
            let claseVariacion = Math.abs(p.Variacion || 0) > 15 ? "var-alert" : "";

            html += `<td id="${realIndex}_var" class="text-center">
            <span class="${claseVariacion}">${p.Variacion.toFixed(0)}%</span>
         </td>`;

            // % VAR VS BGT por línea
            let varVsBGTLinea = calcularVarVsBGTLinea(p);
            let claseVarBGT = Math.abs(varVsBGTLinea.Porcentaje || 0) > 15 ? "var-alert" : "";
            html += `<td class="text-center" data-col="variacionBGT">
            <span class="${claseVarBGT}">${varVsBGTLinea.Porcentaje.toFixed(0)}%</span>
         </td>`;

            // ================= COSTO / PRECIO =================
            // ================= COSTO / PRECIO =================

            let disabledCosto = "disabled";
            let disabledPrecio = "disabled";
            let mostrarCosto = false;
            let mostrarPrecio = false;

            if (presupuestoSel.Tipo === "B") {

                let idPresupuesto = $("#PresupuestoSeleccionado").val();
                let idVendedor = $("#VendedorSeleccionado").val();

                let MiAprobacion = Aprobaciones.find(a =>
                    a.idPresupuesto == idPresupuesto &&
                    a.idVendedor == idVendedor &&
                    (a.AprobadoVendedor == "A" ||
                        a.AprobadoCountry == "A" ||
                        a.AprobadoAdmin == "A")
                );

                let bloqueado = MiAprobacion ? true : false;

                mostrarCosto = rolVerCostoBGT;
                mostrarPrecio = rolVerPrecioBGT;

                disabledCosto = (rolEditarForecast && rolVerCostoBGT && rolEditCostoBGT && !bloqueado) ? "" : "disabled";
                disabledPrecio = (rolEditarForecast && rolVerPrecioBGT && rolEditPrecioBGT && !bloqueado) ? "" : "disabled";

                html += `<td class='text-center' data-col='COSTO' ${mostrarCosto ? "" : "hidden"}> 
        <input id='${realIndex}_COSTO'
            class='month-input costo-input'
            style="width:70px;"
            value='${p.COSTO_BGT?.toFixed(0) || 0}'
            ${disabledCosto}
            oninput="onChangeCantidad(${realIndex}, 'COSTO')"/>
    </td>`;

                html += `<td class='text-center' data-col='PRECIO' ${mostrarPrecio ? "" : "hidden"}> 
        <input id='${realIndex}_PRECIO'
            class='month-input precio-input'
            style="width:70px;"
            value='${p.PRECIO_BGT?.toFixed(0) || 0}'
            ${disabledPrecio}
            oninput="onChangeCantidad(${realIndex}, 'PRECIO')"/>
    </td>`;

            } else {
                html += `<td data-col='COSTO' hidden></td>`;
                html += `<td data-col='PRECIO' hidden></td>`;
            }


            html += "</tr>";

            // ================= DETAIL ROW =================

            let lineaY1 = buscarLineaPorYear(p, Anios.año1);
            let lineaY2 = buscarLineaPorYear(p, Anios.año2);
            let precioCostoYear1 = obtenerPrecioCostoYear1(p);

            html += `
${existePresupuestoEnero(Anios.año1) && lineaY1
                    ? buildForecastProyectadoRow(`AÑO 1 (${Anios.año1})`, "year1", realIndex, "year1", lineaY1, p.Factor, precioCostoYear1.Precio)
                    : ""}

${existePresupuestoEnero(Anios.año2) && lineaY2
                    ? buildForecastProyectadoRow(`AÑO 2 (${Anios.año2})`, "year2", realIndex, "year2", lineaY2, p.Factor, p.Precio)
                    : ""}

${presupuestoSel?.Tipo != "B"
                ? buildBandRow("BUDGET", "budget", true, obtenerBudgetLinea(p, presupuestoBGT), realIndex, p.Factor, p.Precio)
                    : ""}
${buildBandRow("LAST YEAR", "lastyear", true, obtenerLastYearLinea(p), realIndex, p.Factor, p.Precio)}
${buildBandRow("LAST FORECAST", "lastforecast", true, obtenerLastForecastLinea(p), realIndex, p.Factor, p.Precio)}
${buildBandRow("MATILDA", "matilda", true, null)}
`;
        }

        $("#tbody").html(html);
        actualizarBotonesOrden();
        // 🔥 REAPLICAR DISABLED (FIX REAL)
        //$("#tbody input.month-input").each(function () {

        //    let id = $(this).attr("id");

        //    if (!id) return;

        //    let partes = id.split("_");

        //    // 🔥 el mes SIEMPRE es el último elemento
        //    let mesNombre = partes[partes.length - 1];

        //    let idxMes = MESES.indexOf(mesNombre);
        //    if (idxMes === -1) return;

        //    let numMes = idxMes + 1;

        //    if (MesDebeIrDisabled(numMes)) {
        //        $(this).prop("disabled", true);
        //    } else {
        //        $(this).prop("disabled", false);
        //    }
        //});
        actualizarInfoPagina();

    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error ' + e
        });
    }
}
function calcularVarVsBGTLinea(p) {
    try {
        let idPresupuesto = $("#PresupuestoSeleccionado").val();
        let presupuestoSel = Presupuestos.find(x => x.id == idPresupuesto);

        if (!presupuestoSel) {
            return { Monto: 0, Porcentaje: 0 };
        }

        let bgt = Presupuestos.find(x =>
            x.Tipo == "B" &&
            parseInt(x.Year) === parseInt(presupuestoSel.Year)
        );

        if (!bgt) {
            return { Monto: 0, Porcentaje: 0 };
        }

        let lineaBGT = ProdCadena.find(x =>
            x.idPresupuesto == bgt.id &&
            x.idCliente == p.idCliente &&
            x.idProducto == p.idProducto &&
            x.idVendedor == p.idVendedor &&
            x.idSucursal == p.idSucursal
        );

        if (!lineaBGT) {
            return { Monto: 0, Porcentaje: 0 };
        }

        let totalActual = calcularTotalAnual(p);
        let totalAnterior = calcularTotalAnual(lineaBGT);
        let monto = totalActual - totalAnterior;

        let porcentaje = totalAnterior > 0
            ? (monto / totalAnterior) * 100
            : 0;

        return {
            Monto: monto,
            Porcentaje: porcentaje
        };

    } catch (e) {
        console.error("Error calcularVarVsBGTLinea:", e);
        return { Monto: 0, Porcentaje: 0 };
    }
}
function inicializarTotalesOriginales() {
    ProdCadena.forEach(x => {
        x.TotalOriginal = calcularTotalAnual(x);
    });
}


function buildForecastProyectadoRow(label, cssClass, indexFila, yearKey, dataLinea, factor = 1, precio = 0) {
    try {

        if (!dataLinea) return "";

        if (dataLinea.MES === "00") return "";

        let celdas = "";
        let total = 0;

        MESES.forEach((mes, idx) => {

            let cantidad = parseFloat(dataLinea?.[mes + "_CANT"] || 0);
            let valor = cantidad;

            // 🔥 modos
            if (modoActual === "kg") {
                valor = cantidad * (factor || 1);
            }
            else if (modoActual === "usd") {
                valor = cantidad * (precio || 0);
            }

            total += valor;

            const idInput = `${indexFila}_${yearKey}_${mes}`;

            // 🔥 disabled solo en modos visuales
            let disabled = "";

            let idPresupuesto = $("#PresupuestoSeleccionado").val();
            let presupuestoSel = Presupuestos.find(a => a.id == idPresupuesto);

            // 🔥 Deshabilitar en modos visuales o si es BGT
            if (
                !rolEditarForecast ||
                ((modoActual !== "units" && modoActual !== "15") ||
                    presupuestoSel?.Tipo == "B")
            ) {
                disabled = "disabled";
            }


            celdas += `
                <td class="text-center">
                    <input
                        id="${idInput}"
                        class="month-input ${cssClass}"
                        value="${modoActual === "usd"
                    ? "$" + formatoDecimal(valor.toFixed(0))
                    : formatearNumero(valor)}"
                        data-raw="${cantidad}"
                        ${disabled}
                        oninput="onChangeCantidadProyectado('${indexFila}', '${yearKey}')"
                    />
                </td>
            `;
        });

        let totalFormateado = modoActual === "usd"
            ? "$" + formatoDecimal(total.toFixed(0))
            : formatearNumero(total);

        // 🔥 CLAVE: misma estructura que la tabla principal
        return `
<tr class="detail-row band-${cssClass}" data-parent="${indexFila}" style="display:none;">
            
            <!-- CUSTOMER -->
            <td></td>

            <!-- SKU / LABEL -->
         <td class="sub-label">
    ${label}
</td>

            <!-- MESES -->
            ${celdas}

            <!-- TOTAL -->
            <td><strong>${totalFormateado}</strong></td>

            <!-- % VAR -->
            <td></td>

        </tr>`;

    } catch (e) {
        console.error("Error buildForecast:", e);
        return "";
    }
}



function buscarLineaPorYear(p, year) {

    // 🔍 buscar si existe data real
    let presupuestoEnero = Presupuestos
        .filter(x =>
            x.Tipo == "F" &&
            parseInt(x.Year) === parseInt(year) &&
            parseInt(x.Mes) === 1
        )
        .sort((a, b) => parseInt(b.id || 0) - parseInt(a.id || 0))[0];

    let reales = ProdCadena.filter(x =>
        x.idCliente == p.idCliente &&
        x.idProducto == p.idProducto &&
        (
            presupuestoEnero
                ? x.idPresupuesto == presupuestoEnero.id
                : x.Year == year.toString()
        )
    );

    // ✅ SI EXISTE → usarla (sumada)
    if (reales.length > 0) {

        let resultado = {};
        MESES.forEach(m => resultado[m + "_CANT"] = 0);

        reales.forEach(l => {
            MESES.forEach(m => {
                resultado[m + "_CANT"] += parseFloat(l[m + "_CANT"] || 0);
            });
        });

        return resultado;
    }

    // 🔥 SI NO EXISTE → PROYECTAR (AQUÍ ESTÁ LA MAGIA)

    // base = año actual
    let base = ProdCadena.filter(x =>
        x.idCliente == p.idCliente &&
        x.idProducto == p.idProducto &&
        x.Year == p.Year
    );

    if (!base.length) return null;

    let resultado = {};
    MESES.forEach(m => resultado[m + "_CANT"] = 0);

    base.forEach(l => {
        MESES.forEach(m => {
            let valor = parseFloat(l[m + "_CANT"] || 0);

            // 🔥 PROYECCIÓN (ajústalo si querés)
            resultado[m + "_CANT"] += valor * 1.05; // +5%
        });
    });

    return resultado;
}

function existePresupuestoEnero(year) {
    try {
        return Presupuestos.some(p =>
            p.Year == year &&
            parseInt(p.Mes) === 1
        );
    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Ha ocurrido un error ' + e

        })
    }

}
function obtenerAniosProyectados() {
    try {
        var idPresupuesto = $("#PresupuestoSeleccionado").val();
        var p = Presupuestos.find(x => x.id == idPresupuesto);

        if (!p) return { año1: null, año2: null };

        let añoActual = parseInt(p.Year);

        return {
            año1: añoActual + 1,
            año2: añoActual + 2
        };

    } catch (e) {
        console.error(e);
    }
}
function buildBandRow(label, cssClass, disabledAll, dataLinea, indexFila, factor = 1, precio = 0) {
    try {

        let celdas = "";
        let total = 0;

        MESES.forEach(mes => {

            let cantidad = parseFloat(dataLinea?.[mes + "_CANT"] || 0);
            let valor = cantidad;

            if (modoActual === "kg") {
                valor = cantidad * factor;
            } else if (modoActual === "usd") {

                let precioFinal = precio;

                // 🔥 USAR PRECIO CORRECTO SEGÚN LA FILA
                if (cssClass === "budget") {
                    precioFinal = dataLinea?.PRECIO_BGT || precio;
                }

                if (cssClass === "lastforecast") {
                    precioFinal = dataLinea?.PRECIO_FACT || precio;
                }

                // lastyear se queda con precio normal (ventas)

                valor = cantidad * (precioFinal || 0);
            }

            total += valor;

            const idInput = `${indexFila}_${cssClass}_${mes}`; // 🔥 ID REAL

            celdas += `
                <td class="text-center">
                    <input 
                        id="${idInput}"
                        class="month-input ${cssClass}"
                        value="${modoActual === "usd"
                    ? "$" + formatoDecimal(valor.toFixed(0))
                    : formatearNumero(valor)}"
                        data-raw="${cantidad}"
                        ${disabledAll ? "disabled" : ""}
                    />
                </td>
            `;
        });

        return `
         <tr class="detail-row band-${cssClass}" data-parent="${indexFila}" style="display:none;">
                <td></td>
                <td>${label}</td>
                ${celdas}
                <td><strong>${formatearNumero(total)}</strong></td>
                <td></td>
            </tr>`;
    } catch (e) {
        console.error(e);
        return "";
    }
}









function obtenerLastYearLinea(p) {
    try {
        let idPresupuestoSel = $("#PresupuestoSeleccionado").val();
        let presupuestoSel = Presupuestos.find(x => x.id == idPresupuestoSel);

        let yearAnterior = presupuestoSel?.Tipo == "B"
            ? new Date().getFullYear() - 1
            : parseInt(p.Year) - 1;

        // Inicializa meses en cero
        let data = {};
        MESES.forEach(m => data[m + "_CANT"] = 0);

        // Filtrar ventas del año anterior
        let ventasLinea = Ventas.filter(v => {
            let fecha = new Date(v.Fecha);
            return (
                v.idCliente == p.idCliente &&
                v.idProducto == p.idProducto &&
                fecha.getFullYear() === yearAnterior
            );
        });

        // Sumar por mes
        ventasLinea.forEach(v => {
            let fecha = new Date(v.Fecha);
            let mes = fecha.getMonth(); // 0 = Enero

            let nombreMes = MESES[mes];
            let campo = nombreMes + "_CANT";

            data[campo] += parseFloat(v.Cantidad || 0);
        });

        return data; // devuelve objeto con los 12 meses llenos
    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Ha ocurrido un error ' + e

        })
    }

}

function obtenerLastForecastLinea(p) {
    try {
        let idPresupuestoSel = $("#PresupuestoSeleccionado").val();
        let presupuestoSel = Presupuestos.find(x => x.id == idPresupuestoSel);

        let mesAnterior;
        let yearAnterior;
        let presupuestoForecastCerrado = null;

        if (presupuestoSel?.Tipo == "B") {
            let hoy = new Date();
            mesAnterior = hoy.getMonth(); // Mayo => 4, o sea abril cerrado.
            yearAnterior = hoy.getFullYear();

            if (mesAnterior === 0) {
                mesAnterior = 12;
                yearAnterior -= 1;
            }

            presupuestoForecastCerrado = Presupuestos
                .filter(x =>
                    x.Tipo == "F" &&
                    parseInt(x.Year) === parseInt(yearAnterior) &&
                    parseInt(x.Mes) === parseInt(mesAnterior)
                )
                .sort((a, b) => parseInt(b.id || 0) - parseInt(a.id || 0))[0];

        } else {
            mesAnterior = parseInt(p.MES) - 1;
            yearAnterior = p.Year;

            if (mesAnterior === 0) {
                mesAnterior = 12;
                yearAnterior = (parseInt(p.Year) - 1).toString();
            }
        }

        mesAnterior = mesAnterior.toString().padStart(2, '0');

        let lineaAnterior = ProdCadena.find(a =>
            a.idCliente == p.idCliente &&
            a.idProducto == p.idProducto &&
            (
                presupuestoForecastCerrado
                    ? a.idPresupuesto == presupuestoForecastCerrado.id
                    : a.Year == yearAnterior && a.MES == mesAnterior
            )
        );

        let data = {};
        MESES.forEach(m => data[m + "_CANT"] = 0);

        if (!lineaAnterior) return data;

        MESES.forEach(m => {
            data[m + "_CANT"] = parseFloat(lineaAnterior[m + "_CANT"]) || 0;
        });

        return data;
    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Ha ocurrido un error ' + e
        });
    }
}

function obtenerUltimoForecastCerradoLinea(p) {
    try {
        let hoy = new Date();

        // Si hoy es mayo, ultimoMesCerrado = abril
        let ultimoMesCerrado = hoy.getMonth(); // 1-12 por como funciona: Mayo => 4
        let yearCerrado = hoy.getFullYear();

        if (ultimoMesCerrado === 0) {
            ultimoMesCerrado = 12;
            yearCerrado -= 1;
        }

        let ultimoForecastCerrado = Presupuestos
            .filter(x =>
                x.Tipo == "F" &&
                parseInt(x.Year) === yearCerrado &&
                parseInt(x.Mes) === ultimoMesCerrado
            )
            .sort((a, b) => b.id - a.id)[0];

        if (!ultimoForecastCerrado) return null;

        let linea = ProdCadena.find(x =>
            x.idPresupuesto == ultimoForecastCerrado.id &&
            x.idCliente == p.idCliente &&
            x.idProducto == p.idProducto
        );

        if (!linea) return null;

        let data = {};
        MESES.forEach(m => {
            data[m + "_CANT"] = parseFloat(linea[m + "_CANT"] || 0);
        });

        data.PRECIO_FACT = linea.PRECIO_FACT;
        data.COSTO_FACT = linea.COSTO_FACT;
        data.Precio = linea.Precio;
        data.Costo = linea.Costo;

        return data;
    } catch (e) {
        console.error("Error obtenerUltimoForecastCerradoLinea:", e);
        return null;
    }
}
async function onChangeVendedor() {
    try {

       $("#ClienteSeleccionado").val(0);
       $("#ProductoSeleccionado").val(0);
       $("#MarcaSeleccionado").val(0);
       $("#IngredienteSeleccionado").val(0);
       $("#GrupoSeleccionado").val(0);

        await onChangeFiltro(); // 🔥 recarga data primero

        // 🔥 ahora sí con data nueva
        RellenaClientes();
        RellenaProductos();
        RellenaMarcas();
        RellenaGrupos();
        RellenaIngredientes();



    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Ha ocurrido un error al intentar recuperar cliente ' + e,
        });
    }
}

async function onChangeFiltro() {
    try {

        $("tr.revisado-row").removeClass("revisado-row");
        let idPresupuesto = $("#PresupuestoSeleccionado").val();
        if ($("#SucursalSeleccionada").val() == 0) {
            Swal.fire({
                icon: 'warning',
                text: 'Seleccione una sucursal'
            });
            return;
        }
        if (idPresupuesto != 0) {
            await cargarForecast(idPresupuesto);

        }
        var Forecast = $("#PresupuestoSeleccionado").val();
        var Cliente = $("#ClienteSeleccionado").val();
        var Producto = $("#ProductoSeleccionado").val();
        var Grupo = $("#GrupoSeleccionado").val();
        var Ingrediente = $("#IngredienteSeleccionado").val();
        var Vendedor = $("#VendedorSeleccionado").val();
        var Marca = $("#MarcaSeleccionado").val();


        // Inicializa un array de filtros
        let filters = [];

        if (Forecast != 0) {
            var Presupuesto = Presupuestos.find(a => a.id == Forecast);

            filters.push(a => a.idPresupuesto == Forecast);
            var MiPresupuesto = Presupuestos.find(a => a.id == Forecast);
            $("#presupuestoREAL").text("REAL + " + MiPresupuesto.Codigo);
        /*    $("#presupuestoKPI").text(MiPresupuesto.Codigo);*/




        } else {
            $("#presupuestoREAL").text("REAL + FCT");
            $("#presupuestoKPI").text("FCT");
        }



        if (Producto != 0) {
            filters.push(a => a.idProducto == Producto);
        }
        if (Grupo != 0) {
            filters.push(a => a.idGrupo == Grupo);
        }
        if (Ingrediente != 0) {
            filters.push(a => a.idIngrediente == Ingrediente);
        }
        if (Marca != 0) {
            filters.push(a => a.idMarca == Marca);
        }
        if (Vendedor != 0) {
            filters.push(a => a.idVendedor == Vendedor);

        
        }
        if (Cliente != 0) {
            filters.push(a => a.idCliente == Cliente);
        }
        // Filtra los productos usando el array de filtros
        ProdClientes = ProdCadena.filter(a => filters.every(filter => filter(a)));
        ProdClientesBase = [...ProdClientes];
        // Rellena la tabla al final
        RellenaTabla();
        ProdClientes.forEach(p => {
            if (!p.Revisado) {
                $(`tr[data-row='${ProdClientes.indexOf(p)}']`).removeClass("revisado-row");
            }
        });
        if (Presupuesto.Tipo == "B") {

            // COSTO
            if (rolVerCostoBGT) {
                $("th[data-col='COSTO'], td[data-col='COSTO']").prop("hidden", false);
            } else {
                $("th[data-col='COSTO'], td[data-col='COSTO']").prop("hidden", true);
            }

            // PRECIO
            if (rolVerPrecioBGT) {
                $("th[data-col='PRECIO'], td[data-col='PRECIO']").prop("hidden", false);
            } else {
                $("th[data-col='PRECIO'], td[data-col='PRECIO']").prop("hidden", true);
            }

        } else {
            $("th[data-col='COSTO'], td[data-col='COSTO']").prop("hidden", true);
            $("th[data-col='PRECIO'], td[data-col='PRECIO']").prop("hidden", true);
        }
        if (Forecast != undefined && Forecast != 0) {
            CalcularKPIS();
        }

    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Ha ocurrido un error al intentar recuperar cliente ' + e,
        });
    }
}
function calcularTotalDesdeMes(linea, mesInicio) {
    if (!linea) return 0; // 🔥

    let total = 0;

    for (let m = mesInicio - 1; m < MESES.length; m++) {
        let campo = MESES[m] + "_CANT";
        total += parseFloat(linea?.[campo] || 0);
    }

    return total;
}
function calcularTotalAnual(linea) {
    if (!linea) return 0; // 🔥 ESTA ES LA CLAVE

    return (
        parseFloat(linea.ENERO_CANT || 0) +
        parseFloat(linea.FEBRERO_CANT || 0) +
        parseFloat(linea.MARZO_CANT || 0) +
        parseFloat(linea.ABRIL_CANT || 0) +
        parseFloat(linea.MAYO_CANT || 0) +
        parseFloat(linea.JUNIO_CANT || 0) +
        parseFloat(linea.JULIO_CANT || 0) +
        parseFloat(linea.AGOSTO_CANT || 0) +
        parseFloat(linea.SETIEMBRE_CANT || 0) +
        parseFloat(linea.OCTUBRE_CANT || 0) +
        parseFloat(linea.NOVIEMBRE_CANT || 0) +
        parseFloat(linea.DICIEMBRE_CANT || 0)
    );
}
function CalcularAnualBGT() {
    try {
        var idPresupuesto = $("#PresupuestoSeleccionado").val();
        var Presupuesto = Presupuestos.find(a => a.id == idPresupuesto);
        var ANUALBGT = Presupuestos.find(a => a.Tipo == "B" && a.Year == Presupuesto.Year);

        if (!ANUALBGT) return 0;

        let totalAnualBGT = 0;

        // Filtrar forecast del BGT
        var Cliente = $("#ClienteSeleccionado").val();
        var Producto = $("#ProductoSeleccionado").val();
        var VendedorSel = $("#VendedorSeleccionado").val();

        var ForecastBGT = ProdCadena.filter(a =>
            a.idPresupuesto == ANUALBGT.id &&
            (Cliente == 0 || a.idCliente == Cliente) &&
            (Producto == 0 || a.idProducto == Producto) &&
            (VendedorSel == 0 || a.idVendedor == VendedorSel)
        );

        ForecastBGT.forEach(item => {

            // PrecioBGT viene en el forecast (últimas columnas)
            let precioBGT = parseFloat(item.PRECIO_BGT);

            // Recorrer todos los meses y sumar
            MESES.forEach(mes => {

                let cant = parseFloat(item[mes + "_CANT"]) || 0;

                totalAnualBGT += cant * precioBGT;
            });
        });

        return totalAnualBGT;
    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Ha ocurrido un error ' + e

        })
    }

}


function CalcularForecastRestante(Presupuesto) {
    try {

        var ForecastSaleRestante = 0;
        var ForecastCostoRestante = 0;

        var mesInicio = parseInt(Presupuesto.Mes);

        // 🔥 FILTROS IGUALES QUE REAL
        var Cliente = $("#ClienteSeleccionado").val();
        var Producto = $("#ProductoSeleccionado").val();
        var VendedorSel = $("#VendedorSeleccionado").val();

        // 🔥 FILTRAR PRODCADENA
        var dataFiltrada = ProdCadena.filter(item => {

            if (item.idPresupuesto != Presupuesto.id) return false;

            if (Cliente != 0 && item.idCliente != Cliente) return false;
            if (Producto != 0 && item.idProducto != Producto) return false;
            if (VendedorSel != 0 && item.idVendedor != VendedorSel) return false;

            return true;
        });

        // 🔥 AHORA SÍ CALCULAR
        dataFiltrada.forEach(item => {

            var Precio = Precios.find(p =>
                p.idProducto == item.idProducto &&
                p.idCliente == item.idCliente &&
                p.idPresupuesto == Presupuesto.id
            );

            // 🔥 USAR FALLBACK SI NO EXISTE
            let precioVenta = 0;
            let costoUnit = 0;

            if (Precio?.Precio && Precio.Precio != 0 && Precio?.Costo && Precio.Costo != 0) {

                precioVenta = Precio.Precio;
                costoUnit = Precio.Costo;

            } else {

                let pc = obtenerPrecioYCosto(item);

                // 🔥 GUARDARLO EN LA LÍNEA (CLAVE DEL FIX)
                item.Precio = pc.Precio;
                item.Costo = pc.Costo;

                precioVenta = pc.Precio || 0;
                costoUnit = pc.Costo || 0;
            }

            for (let m = mesInicio; m <= 12; m++) {

                let nombreMes = MESES[m - 1];
                let campoCant = nombreMes + "_CANT";
                let cantidad = parseFloat(item[campoCant] || 0);

                ForecastSaleRestante += cantidad * precioVenta;
                ForecastCostoRestante += cantidad * costoUnit;
            }
        });

        return {
            ForecastSaleRestante,
            ForecastCostoRestante
        };

    } catch (e) {
        console.error("Error CalcularForecastRestante:", e);
        return { ForecastSaleRestante: 0, ForecastCostoRestante: 0 };
    }
}
function CalcularRealFCTBudgetUltimoForecastCerrado(PresupuestoBudget) {
    try {
        if (!PresupuestoBudget) {
            return {
                RealFCT: 0,
                CostosFCT: 0,
                RealHastaCorte: 0,
                ForecastSaleRestante: 0,
                ForecastCostoRestante: 0,
                GM_RealFCT: 0
            };
        }

        let hoy = new Date();
        let ultimoMesCerrado = hoy.getMonth(); // Mayo => 4, o sea abril cerrado.
        let yearCerrado = hoy.getFullYear();

        if (ultimoMesCerrado === 0) {
            ultimoMesCerrado = 12;
            yearCerrado -= 1;
        }

        let ultimoForecastCerrado = Presupuestos
            .filter(p =>
                p.Tipo == "F" &&
                parseInt(p.Year) === yearCerrado &&
                parseInt(p.Mes) === ultimoMesCerrado
            )
            .sort((a, b) => parseInt(b.id || 0) - parseInt(a.id || 0))[0];

        var Cliente = $("#ClienteSeleccionado").val();
        var Producto = $("#ProductoSeleccionado").val();
        var VendedorSel = $("#VendedorSeleccionado").val();

        let inicioYear = new Date(yearCerrado, 0, 1, 0, 0, 0);
        let finReal = new Date(yearCerrado, ultimoMesCerrado, 0, 23, 59, 59);

        let ventasRealCorte = Ventas.filter(v => {
            let fecha = new Date(v.Fecha);

            if (fecha < inicioYear || fecha > finReal) return false;
            if (Cliente != 0 && v.idCliente != Cliente) return false;
            if (Producto != 0 && v.idProducto != Producto) return false;
            if (VendedorSel != 0 && v.idVendedor != VendedorSel) return false;

            return true;
        });

        let RealHastaCorte = ventasRealCorte.reduce((t, v) => t + (v.Total ?? 0), 0);
        let CostoRealHastaCorte = ventasRealCorte.reduce((t, v) =>
            t + parseFloat((v.Costo ?? 0).toFixed(2)), 0);

        let ForecastSaleRestante = 0;
        let ForecastCostoRestante = 0;

        let mesInicioForecast = ultimoMesCerrado + 1;

        let lineasForecast = ProdClientes.filter(item => {
            let perteneceBudget =
                item.idPresupuesto == PresupuestoBudget.id ||
                item.idBudget == PresupuestoBudget.id;

            if (!perteneceBudget) return false;
            if (Cliente != 0 && item.idCliente != Cliente) return false;
            if (Producto != 0 && item.idProducto != Producto) return false;
            if (VendedorSel != 0 && item.idVendedor && item.idVendedor != VendedorSel) return false;

            return true;
        });

        if (lineasForecast.length === 0) {
            lineasForecast = ProdCadena.filter(item => {
                let perteneceBudget =
                    item.idPresupuesto == PresupuestoBudget.id ||
                    item.idBudget == PresupuestoBudget.id;

                if (!perteneceBudget) return false;
                if (Cliente != 0 && item.idCliente != Cliente) return false;
                if (Producto != 0 && item.idProducto != Producto) return false;
                if (VendedorSel != 0 && item.idVendedor && item.idVendedor != VendedorSel) return false;

                return true;
            });
        }

        lineasForecast.forEach(item => {
            let pc = obtenerPrecioCostoPorPresupuesto(item, ultimoForecastCerrado?.id);

            if (pc.Precio === 0 || pc.Costo === 0) {
                let fallback = obtenerPrecioYCosto(item);

                if (pc.Precio === 0) pc.Precio = fallback.Precio;
                if (pc.Costo === 0) pc.Costo = fallback.Costo;
            }

            for (let m = mesInicioForecast; m <= 12; m++) {
                let campo = MESES[m - 1] + "_CANT";
                let cantidad = parseFloat(item[campo] || 0);

                ForecastSaleRestante += cantidad * (pc.Precio || 0);
                ForecastCostoRestante += cantidad * (pc.Costo || 0);
            }
        });

        let RealFCT = RealHastaCorte + ForecastSaleRestante;
        let CostosFCT = CostoRealHastaCorte + ForecastCostoRestante;
        let GM_RealFCT = RealFCT > 0
            ? ((RealFCT - CostosFCT) / RealFCT) * 100
            : 0;

        return {
            RealFCT,
            CostosFCT,
            RealHastaCorte,
            ForecastSaleRestante,
            ForecastCostoRestante,
            GM_RealFCT
        };

    } catch (e) {
        console.error("Error CalcularRealFCTBudgetUltimoForecastCerrado:", e);
        return {
            RealFCT: 0,
            CostosFCT: 0,
            RealHastaCorte: 0,
            ForecastSaleRestante: 0,
            ForecastCostoRestante: 0,
            GM_RealFCT: 0
        };
    }
}

function CalcularBudgetMonthBGT() {
    try {
        var idPresupuesto = $("#PresupuestoSeleccionado").val();
        var VendedorSel = $("#VendedorSeleccionado").val() || 0;

        var Presupuesto = Presupuestos.find(a => a.id == idPresupuesto);
        if (!Presupuesto) return 0;

        var BGT = Presupuestos.find(a =>
            a.Tipo == "B" &&
            a.Year == Presupuesto.Year
        );
        if (!BGT) return 0;

        let totalBudgetMes = 0;

        var Cliente = $("#ClienteSeleccionado").val();
        var Producto = $("#ProductoSeleccionado").val();

        var ForecastBGT = ProdCadena.filter(a =>
            a.idPresupuesto == BGT.id &&
            (Cliente == 0 || a.idCliente == Cliente) &&
            (Producto == 0 || a.idProducto == Producto) &&
            (VendedorSel == 0 || a.idVendedor == VendedorSel)
        );

        var mesBase = parseInt(Presupuesto.Mes) || 1;
        var mesesBloqueo = obtenerMesesBloqueoSucursal();
        var mesDinamico = mesBase + mesesBloqueo;

        if (mesDinamico > 12) mesDinamico = 12;

        var campoMes = MESES[mesDinamico - 1] + "_CANT";

        ForecastBGT.forEach(item => {
            let precioBGT = parseFloat(item.PRECIO_BGT) || 0;
            let cantidadMes = parseFloat(item[campoMes]) || 0;

            totalBudgetMes += cantidadMes * precioBGT;
        });

        return totalBudgetMes;

    } catch (e) {
        console.error("Error BudgetMonthBGT:", e);
        return 0;
    }
}
function calcularForecastSalePorMes(mesNumero) {
    let ForecastSale = 0;
    let ForecastCosto = 0;

    let idxMes = mesNumero - 1;
    let campo = MESES[idxMes] + "_CANT";

    for (var i = 0; i < ProdClientes.length; i++) {
        let itemReal = ProdCadena.find(x => x.id == ProdClientes[i].id);
        if (!itemReal) continue;

        var Precio = Precios.find(a =>
            a.idProducto == itemReal.idProducto &&
            a.idCliente == itemReal.idCliente &&
            a.idPresupuesto == itemReal.idPresupuesto
        );

        let pc = (!Precio?.Precio || Precio.Precio == 0 || !Precio?.Costo || Precio.Costo == 0)
            ? obtenerPrecioYCosto(itemReal)
            : null;

        let precioVenta = (Precio?.Precio && Precio.Precio != 0)
            ? Precio.Precio
            : pc?.Precio || 0;

        let costoUnit = (Precio?.Costo && Precio.Costo != 0)
            ? Precio.Costo
            : pc?.Costo || 0;

        let cantidad = parseFloat(itemReal[campo] || 0);

        ForecastSale += cantidad * precioVenta;
        ForecastCosto += cantidad * costoUnit;
    }

    let GM = ForecastSale > 0
        ? ((ForecastSale - ForecastCosto) / ForecastSale) * 100
        : 0;

    return {
        Mes: MESES[idxMes],
        ForecastSale,
        ForecastCosto,
        GM
    };
}
function CalcularKPIS() {
    try {

        var ForecastSel = $("#PresupuestoSeleccionado").val();
        var Cliente = $("#ClienteSeleccionado").val();
        var Producto = $("#ProductoSeleccionado").val();
        var VendedorSel = $("#VendedorSeleccionado").val();
        var Presupuesto = Presupuestos.find(a => a.id == ForecastSel);

        var nombreMes = MESES[Presupuesto.Mes - 1];
        var campoMes = nombreMes + "_CANT";

        // ===================================================
        // ===================================================
        // 🔥 REAL SALES YTD (CORTE HASTA MES FORECAST)
        // ===================================================

        // Año del presupuesto
        var year = parseInt(Presupuesto.Year);

        // 🔥 Mes seleccionado (0-11)
        var mesForecast = parseInt(Presupuesto.Mes) - 1;

        // 🔥 Inicio: 1 de enero 00:00
        var inicioYear = new Date(year, 0, 1, 0, 0, 0);

        // 🔥 Fin: último día del mes seleccionado 23:59:59
        var finForecast = new Date(year, mesForecast + 1, 0, 23, 59, 59);

        // 🔥 FILTRO CORRECTO
        var ventasFiltradas = Ventas.filter(v => {
            var fechaVenta = new Date(v.Fecha);

            // 🔥 Rango YTD hasta mes forecast
            if (fechaVenta < inicioYear || fechaVenta > finForecast) return false;

            if (Cliente != 0 && v.idCliente != Cliente) return false;
            if (Producto != 0 && v.idProducto != Producto) return false;
            if (VendedorSel != 0 && v.idVendedor != VendedorSel) return false;

            return true;
        });

        // 🔥 VENTAS
        var RealSales = ventasFiltradas.reduce((t, v) => t + (v.Total ?? 0), 0);

        // 🔥 COSTO


        var CostoRealSales = ventasFiltradas.reduce((t, v) =>
            t + parseFloat((v.Costo ?? 0).toFixed(2)), 0);

        var ventasAbs = Math.abs(RealSales);
        var costoAbs = Math.abs(CostoRealSales);

        var GM_RealSales = ventasAbs > 0
            ? ((ventasAbs - costoAbs) / ventasAbs) * 100
            : 0;
        // ===================================================
        // ===================================================
        // 🔥 FORECAST SALE DINÁMICO SEGÚN BLOQUEO / ROL
        // ===================================================
        var mesForecastBase = parseInt(Presupuesto.Mes) || 1;
        var mesesBloqueo = obtenerMesesBloqueoSucursal();

        var mesDesde = rolEditarMesesBloqueados
            ? mesForecastBase
            : mesForecastBase + mesesBloqueo;

        var mesHasta = mesForecastBase + mesesBloqueo;

        if (mesDesde > 12) mesDesde = 12;
        if (mesHasta > 12) mesHasta = 12;

        let forecastMesesKPI = [];

        for (let m = mesDesde; m <= mesHasta; m++) {
            forecastMesesKPI.push(calcularForecastSalePorMes(m));
        }

        let forecastPrincipal = forecastMesesKPI[0] || {
            ForecastSale: 0,
            ForecastCosto: 0,
            GM: 0
        };

        var ForecastSale = forecastPrincipal.ForecastSale;
        var ForecastCosto = forecastPrincipal.ForecastCosto;
        var GM_ForecastSale = forecastPrincipal.GM;
        // ===================================================
        // ===================================================
        // ⭐ MONTH REAL SALES (COSTO IGUAL A YTD)
        // ===================================================
        var MonthRealSales = 0;
        var MonthCosto = 0;

        var yearMes = Presupuesto.Year;
        var mes = Presupuesto.Mes - 1;

        var inicioMes = new Date(yearMes, mes, 1);
        var finMes = new Date(yearMes, mes + 1, 0);

        var ventasMes = Ventas.filter(v => {
            var fecha = new Date(v.Fecha);

            if (fecha < inicioMes || fecha > finMes) return false;
            if (Cliente != 0 && v.idCliente != Cliente) return false;
            if (Producto != 0 && v.idProducto != Producto) return false;
            if (VendedorSel != 0 && v.idVendedor != VendedorSel) return false;

            return true;
        });

        ventasMes.forEach(v => {

            // 🔥 VENTA IGUAL
            MonthRealSales += (v.Total ?? 0);

            // 🔥 COSTO IGUAL QUE YTD
            MonthCosto += parseFloat((v.Costo ?? 0).toFixed(2));
        });

        var ventasAbs = Math.abs(MonthRealSales);
        var costoAbs = Math.abs(MonthCosto);

        var GM_MonthRealSales = ventasAbs > 0
            ? ((ventasAbs - costoAbs) / ventasAbs) * 100
            : 0;

        if (Presupuesto.Tipo == "B") {
            MonthRealSales = 0;
            GM_MonthRealSales = 0;
        }

        // ===================================================
        // ===================================================
        // 🔥 REAL + FCT (CORTE MES ANTERIOR)
        // ===================================================

        // Año
        var year = parseInt(Presupuesto.Year);

        // 🔥 MES ANTERIOR
        var mesCorte = parseInt(Presupuesto.Mes) - 2;

        // 🔥 FECHAS
        var inicioYear = new Date(year, 0, 1, 0, 0, 0);
        var finReal = new Date(year, mesCorte + 1, 0, 23, 59, 59);

        // 🔥 REAL SOLO HASTA MES ANTERIOR
        var ventasRealCorte = Ventas.filter(v => {
            var fecha = new Date(v.Fecha);

            if (fecha < inicioYear || fecha > finReal) return false;

            if (Cliente != 0 && v.idCliente != Cliente) return false;
            if (Producto != 0 && v.idProducto != Producto) return false;
            if (VendedorSel != 0 && v.idVendedor != VendedorSel) return false;

            return true;
        });

        // 🔥 VENTAS
        var RealHastaCorte = ventasRealCorte.reduce((t, v) => t + (v.Total ?? 0), 0);

        // 🔥 COSTO
        var CostoRealHastaCorte = ventasRealCorte.reduce((t, v) =>
            t + parseFloat((v.Costo ?? 0).toFixed(2)), 0);


        // 🔥 FORECAST (MARZO → DICIEMBRE)
        var fct = CalcularForecastRestante(Presupuesto);

        // 🔥 SUMA CORRECTA
        var RealFCT = RealHastaCorte + fct.ForecastSaleRestante;
        var CostosFCT = CostoRealHastaCorte + fct.ForecastCostoRestante;

        // 🔥 GM
        //var GM_RealFCT = RealFCT > 0
        //    ? (1 - (CostosFCT / RealFCT)) * 100
        //    : 0;

        var GM_RealFCT = RealFCT > 0
            ? ((RealFCT - CostosFCT) / RealFCT) * 100
            : 0;

        // ===================================================
        // ANUAL BGT
        // ===================================================
        var AnualBGT = CalcularAnualBGT();
        var CostoAnualBGT = 0;

        var PresSel = Presupuestos.find(a => a.id == ForecastSel);
        var BGT = Presupuestos.find(p => p.Tipo == "B" && p.Year == PresSel.Year);

        if (BGT) {
            var ForecastBGT = ProdCadena.filter(a => a.idPresupuesto == BGT.id);

            ForecastBGT.forEach(item => {
                MESES.forEach(mes => {
                    CostoAnualBGT += (parseFloat(item[mes + "_CANT"]) || 0) * (item.COSTO_BGT || 0);
                });
            });
        }

        var GM_AnualBGT = AnualBGT > 0
            ? (1 - (CostoAnualBGT / AnualBGT)) * 100
            : 0;

        // BUDGET MONTH BGT (FIX)
        // ===================================================
        var BudgetMonthBGT = CalcularBudgetMonthBGT();
        var CostoBudgetMonth = 0;

        var PresSel = Presupuestos.find(a => a.id == ForecastSel);
        var BGT = Presupuestos.find(p => p.Tipo == "B" && p.Year == PresSel.Year);

        if (BGT) {

            // 🔥 REGENERAR DATA CORRECTA
            let ForecastBGTLocal = ProdCadena.filter(a =>
                a.idPresupuesto == BGT.id &&
                (VendedorSel == 0 || a.idVendedor == VendedorSel)
            );

            // 🔥 MES CORRECTO
            let mesBaseBGT = parseInt(PresSel.Mes) || 1;
            let mesesBloqueoBGT = obtenerMesesBloqueoSucursal();
            let mesDinamicoBGT = mesBaseBGT + mesesBloqueoBGT;

            if (mesDinamicoBGT > 12) mesDinamicoBGT = 12;

            let campoMesBGT = MESES[mesDinamicoBGT - 1] + "_CANT";

            ForecastBGTLocal.forEach(item => {
                let cantidadMes = parseFloat(item[campoMesBGT]) || 0;
                let costo = parseFloat(item.COSTO_BGT) || 0;

                CostoBudgetMonth += cantidadMes * costo;
            });
        }

        var GM_BudgetMonthBGT = BudgetMonthBGT > 0
            ? (1 - (CostoBudgetMonth / BudgetMonthBGT)) * 100
            : 0;
        // ===================================================
        // % VAR VS BGT
        // Siempre usa el mes de trabajo real: Mes forecast + bloqueo sucursal
        // ===================================================
        var mesBaseVarBGT = parseInt(Presupuesto.Mes) || 1;
        var mesesBloqueoVarBGT = obtenerMesesBloqueoSucursal();
        var mesTrabajoVarBGT = mesBaseVarBGT + mesesBloqueoVarBGT;

        if (mesTrabajoVarBGT > 12) mesTrabajoVarBGT = 12;

        let realFCTMesTrabajo = calcularForecastSalePorMes(mesTrabajoVarBGT);

        var RealFCTMes = realFCTMesTrabajo.ForecastSale || 0;
        var BGTMes = BudgetMonthBGT || 0;

        var VarVsBGTMonto = RealFCTMes - BGTMes;

        var VarVsBGTPorcentaje = BGTMes > 0
            ? ((RealFCTMes - BGTMes) / BGTMes) * 100
            : 0;
        // ===================================================
        // ===================================================
        // ===================================================
        // ===================================================
        // YEAR 1 (FIX FINAL REAL)
        // ===================================================
        var YearSale = 0;
        var YearCost = 0;
        var MonthYearSale = 0;
        var MonthYearCost = 0;
        let year1 = parseInt(Presupuesto.Year) + 1;

        let presupuestoYear1 = Presupuestos
            .filter(p =>
                p.Tipo == "F" &&
                parseInt(p.Year) === year1 &&
                parseInt(p.Mes) === 1
            )
            .sort((a, b) => parseInt(b.id || 0) - parseInt(a.id || 0))[0];

        let lineasYear1 = ProdCadena.filter(item => {
            if (presupuestoYear1) {
                if (item.idPresupuesto != presupuestoYear1.id) return false;
            } else if (parseInt(item.Year) !== year1) {
                return false;
            }

            if (Cliente != 0 && item.idCliente != Cliente) return false;
            if (Producto != 0 && item.idProducto != Producto) return false;
            if (VendedorSel != 0 && item.idVendedor != VendedorSel) return false;

            return true;
        });

        lineasYear1.forEach(item => {

            let precioCostoYear1 = obtenerPrecioCostoYear1(item);
            let precioVenta = precioCostoYear1.Precio || 0;
            let costoUnit = precioCostoYear1.Costo || 0;
            let campoMonthYear = MESES[parseInt(Presupuesto.Mes) - 1] + "_CANT";
            let cantMonthYear = parseFloat(item[campoMonthYear] || 0);

            MonthYearSale += cantMonthYear * precioVenta;
            MonthYearCost += cantMonthYear * costoUnit;
            MESES.forEach(mes => {
                let cant = parseFloat(item[mes + "_CANT"] || 0);

                YearSale += cant * precioVenta;
                YearCost += cant * costoUnit;
            });
        });

        // 🔥 GM
        var GM_Year = YearSale > 0
            ? ((YearSale - YearCost) / YearSale) * 100
            : 0;
        var GM_MonthYear = MonthYearSale > 0
            ? ((MonthYearSale - MonthYearCost) / MonthYearSale) * 100
            : 0;
        // ===================================================
        // MOSTRAR KPI
        // ===================================================
        $("#RealSales").text("$ " + formatoDecimal(RealSales.toFixed(0)));
        $("#RealSales").next().text(`% ${GM_RealSales.toFixed(1)} - GM`);

        $("#RealSalesMonth").text("$ " + formatoDecimal(MonthRealSales.toFixed(0)));
        $("#RealSalesMonth").next().text(`% ${GM_MonthRealSales.toFixed(1)} - GM`);

        pintarForecastMesesKPI(forecastMesesKPI);

        if (Presupuesto.Tipo == "B") {
            let realFCTBudget = CalcularRealFCTBudgetUltimoForecastCerrado(Presupuesto);

            $("#RealFCT").text("$ " + formatoDecimal(realFCTBudget.RealFCT.toFixed(0)));

            // GM
            $("#GMRealFCT").text(`% ${realFCTBudget.GM_RealFCT.toFixed(1)} - GM`);

            // DESGLOSE
            $("#DesgloseR").text("$ " + formatoDecimal(realFCTBudget.RealHastaCorte.toFixed(0)));
            $("#DesgloseF").text("$ " + formatoDecimal(realFCTBudget.ForecastSaleRestante.toFixed(0)));
        } else {
            $("#RealFCT").text("$ " + formatoDecimal(RealFCT.toFixed(0)));

            // GM
            $("#GMRealFCT").text(`% ${GM_RealFCT.toFixed(1)} - GM`);

            // DESGLOSE
            $("#DesgloseR").text("$ " + formatoDecimal(RealHastaCorte.toFixed(0)));
            $("#DesgloseF").text("$ " + formatoDecimal(fct.ForecastSaleRestante.toFixed(0)));
        }


        if (Presupuesto.Tipo == "B") {
            $("#AnualBGT").text("$ " + formatoDecimal(RealFCT.toFixed(0)));
            $("#AnualBGT").next().text(`% ${GM_RealFCT.toFixed(1)} - GM`);
        } else {
            $("#AnualBGT").text("$ " + formatoDecimal(AnualBGT.toFixed(0)));
            $("#AnualBGT").next().text(`% ${GM_AnualBGT.toFixed(1)} - GM`);
        }


        $("#BudgetMonthBGT").text("$ " + formatoDecimal(BudgetMonthBGT.toFixed(0)));
        $("#BudgetMonthBGT").next().text(`% ${GM_BudgetMonthBGT.toFixed(1)} - GM`);

        $("#VarVsBGTTitle").text("DIF.$ VS BGT");

        $("#VarVsBGT")
            .text("$ " + formatoDecimal(VarVsBGTMonto.toFixed(0)))
            .removeClass("var-alert var-success")
            .toggleClass("var-success", VarVsBGTMonto > 0)
            .toggleClass("var-alert", VarVsBGTMonto < 0);

        $("#VarVsBGTDetalle").html(`
    <span class="real">$ ${formatoDecimal(RealFCTMes.toFixed(0))}</span>
    <span class="divider">vs</span>
    <span class="forecast">$ ${formatoDecimal(BGTMes.toFixed(0))}</span>
`);
   $("#VarVsBGTPorcentaje").html(`
    <span class="${VarVsBGTPorcentaje > 0 ? "var-success" : VarVsBGTPorcentaje < 0 ? "var-alert" : ""}">
        ${VarVsBGTPorcentaje.toFixed(0)}%
    </span>
    <span> - VAR</span>
`);
        $("#VarVsBGT")
            .toggleClass("var-alert", Math.abs(VarVsBGTPorcentaje || 0) > 15);

        $("#Year").text("$ " + formatoDecimal(YearSale.toFixed(0)));
        $("#Year").next().text(`% ${GM_Year.toFixed(1)} - GM`);

        $("#MonthYear").text("$ " + formatoDecimal(MonthYearSale.toFixed(0)));
        $("#MonthYear").next().text(`% ${GM_MonthYear.toFixed(1)} - GM`);

    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error en KPIS: ' + e
        });
    }
}
function pintarForecastMesesKPI(forecastMesesKPI) {
    try {
        $(".forecast-extra-kpi").remove();

        let idPresupuesto = $("#PresupuestoSeleccionado").val();
        let presupuestoSel = Presupuestos.find(p => p.id == idPresupuesto);

        let yearCorto = "";
        if (presupuestoSel?.Year) {
            yearCorto = presupuestoSel.Year.toString().slice(-2);
        }

        if (!forecastMesesKPI || forecastMesesKPI.length === 0) {
            $("#presupuestoKPI").text("MONTH FCT");
            $("#ForecastSale").text("$ 0");
            $("#GMForecastSale").text("% 0 - GM");
            return;
        }

        function nombreMesCorto(mes) {
            const map = {
                ENERO: "JAN",
                FEBRERO: "FEB",
                MARZO: "MAR",
                ABRIL: "APR",
                MAYO: "MAY",
                JUNIO: "JUN",
                JULIO: "JUL",
                AGOSTO: "AUG",
                SETIEMBRE: "SEP",
                OCTUBRE: "OCT",
                NOVIEMBRE: "NOV",
                DICIEMBRE: "DEC"
            };

            return map[mes] || mes;
        }

        function codigoFCT(item) {
            return "FCT" + nombreMesCorto(item.Mes) + yearCorto;
        }

        let primero = forecastMesesKPI[0];

        $("#presupuestoKPI").text(codigoFCT(primero));
        $("#ForecastSale").text("$ " + formatoDecimal(primero.ForecastSale.toFixed(0)));
        $("#GMForecastSale").text(`% ${primero.GM.toFixed(1)} - GM`);

        for (let i = 1; i < forecastMesesKPI.length; i++) {
            let item = forecastMesesKPI[i];

            let html = `
                <div class="col-xl col-md-6 forecast-extra-kpi">
                    <div class="kpi-card h-100">
                        <div class="kpi-sub">${codigoFCT(item)}</div>
                        <div class="kpi-value">$ ${formatoDecimal(item.ForecastSale.toFixed(0))}</div>
                        <div class="small-muted">% ${item.GM.toFixed(1)} - GM</div>
                    </div>
                </div>
            `;

            $("#ForecastKpisContainer").after(html);
        }

    } catch (e) {
        console.error("Error pintando KPIs FCT:", e);
    }
}
function obtenerPrecioYCosto(item) {

    let precio = 0;
    let costo = 0;

    // 1️⃣ Forecast previo mismo cliente
    let f = Forecast
        .filter(x =>
            x.idProducto == item.idProducto &&
            x.idCliente == item.idCliente &&
            x.PRECIO > 0
        )
        .sort((a, b) => b.id - a.id)[0];

    if (f) {
        precio = parseFloat(f.PRECIO) || 0;
        costo = parseFloat(f.COSTO) || 0;
    }

    // 2️⃣ Tabla precios mismo cliente
    if (precio === 0) {
        let p = Precios
            .filter(x =>
                x.idProducto == item.idProducto &&
                x.idCliente == item.idCliente &&
                x.Precio > 0
            )
            .sort((a, b) => b.id - a.id)[0];

        if (p) {
            precio = parseFloat(p.Precio) || 0;
            costo = parseFloat(p.Costo) || 0;
        }
    }

    // 🔥 3️⃣ SOLO PRODUCTO (LA CLAVE DEL BUG)
    if (precio === 0) {
        let p = Precios
            .filter(x =>
                x.idProducto == item.idProducto &&
                x.Precio > 0
            )
            .sort((a, b) => b.id - a.id)[0];

        if (p) {
            precio = parseFloat(p.Precio) || 0;
            costo = parseFloat(p.Costo) || 0;
        }
    }

    return {
        Precio: precio,
        Costo: costo
    };
}

function obtenerPrecioCostoPorPresupuesto(item, idPresupuesto) {
    try {
        if (!item || !idPresupuesto) {
            return { Precio: 0, Costo: 0 };
        }

        let precio = 0;
        let costo = 0;

        let precioTabla = Precios
            .filter(x =>
                x.idProducto == item.idProducto &&
                x.idCliente == item.idCliente &&
                x.idPresupuesto == idPresupuesto
            )
            .sort((a, b) => b.id - a.id)[0];

        if (precioTabla) {
            precio = parseFloat(precioTabla.Precio) || 0;
            costo = parseFloat(precioTabla.Costo) || 0;
        }

        if (precio === 0 || costo === 0) {
            let forecastLinea = Forecast
                .filter(x =>
                    x.idProducto == item.idProducto &&
                    x.idCliente == item.idCliente &&
                    x.idPresupuesto == idPresupuesto
                )
                .sort((a, b) => b.id - a.id)[0];

            if (forecastLinea) {
                if (precio === 0) precio = parseFloat(forecastLinea.PRECIO) || 0;
                if (costo === 0) costo = parseFloat(forecastLinea.COSTO) || 0;
            }
        }

        return { Precio: precio, Costo: costo };
    } catch (e) {
        console.error(e);
        return { Precio: 0, Costo: 0 };
    }
}

function obtenerPrecioCostoYear1(item) {
    try {
        let idPresupuestoSel = $("#PresupuestoSeleccionado").val();
        let presupuestoSel = Presupuestos.find(p => p.id == idPresupuestoSel);

        if (!presupuestoSel) {
            return obtenerPrecioYCosto(item);
        }

        // AÑO 1 = año seleccionado + 1
        let yearDestino = parseInt(presupuestoSel.Year) + 1;

        let fctJan = Presupuestos.find(p =>
            p.Tipo == "F" &&
            parseInt(p.Year) === yearDestino &&
            parseInt(p.Mes) === 1
        );

        let precioCosto = obtenerPrecioCostoPorPresupuesto(item, fctJan?.id);

        // Si JAN no tiene precio/costo, usar último forecast de ese mismo año destino
        if (precioCosto.Precio === 0 || precioCosto.Costo === 0) {
            let ultimoForecast = Presupuestos
                .filter(p =>
                    p.Tipo == "F" &&
                    parseInt(p.Year) === yearDestino
                )
                .sort((a, b) => {
                    let mesDiff = parseInt(b.Mes || 0) - parseInt(a.Mes || 0);
                    return mesDiff !== 0 ? mesDiff : parseInt(b.id || 0) - parseInt(a.id || 0);
                })[0];

            let precioCostoUltimo = obtenerPrecioCostoPorPresupuesto(item, ultimoForecast?.id);

            if (precioCosto.Precio === 0) precioCosto.Precio = precioCostoUltimo.Precio;
            if (precioCosto.Costo === 0) precioCosto.Costo = precioCostoUltimo.Costo;
        }

        // Último fallback normal
        if (precioCosto.Precio === 0 || precioCosto.Costo === 0) {
            let precioCostoFallback = obtenerPrecioYCosto(item);

            if (precioCosto.Precio === 0) precioCosto.Precio = precioCostoFallback.Precio;
            if (precioCosto.Costo === 0) precioCosto.Costo = precioCostoFallback.Costo;
        }

        return precioCosto;
    } catch (e) {
        console.error(e);
        return obtenerPrecioYCosto(item);
    }
}
function formatoDecimal(numero) {
    try {
        var number = numero;

        // En el alemán la coma se utiliza como separador decimal y el punto para los millares
        return new Intl.NumberFormat("en-US").format(number);
    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Ha ocurrido un error ' + e

        })
    }

}
// Timer por fila
function actualizarCacheForecast(lineaEditada) {
    try {

        let idPresupuesto = $("#PresupuestoSeleccionado").val();
        let vendedor = parseInt($("#VendedorSeleccionado").val()) || 0;
        let sucursal = parseInt($("#SucursalSeleccionada").val()) || 0;

        let cacheKey = `${idPresupuesto}_${vendedor}_${sucursal}`;

        if (!cacheForecast[cacheKey]) return;

        let forecastCache = cacheForecast[cacheKey].forecast;

        let item = forecastCache.find(x => x.id == lineaEditada.id);

        if (!item) return;

        MESES.forEach(mes => {
            item[mes + "_CANT"] = lineaEditada[mes + "_CANT"];
        });

        item.Total = lineaEditada.Total;
        item.Revisado = lineaEditada.Revisado;

        if (lineaEditada.COSTO_BGT !== undefined)
            item.COSTO_BGT = lineaEditada.COSTO_BGT;

        if (lineaEditada.PRECIO_BGT !== undefined)
            item.PRECIO_BGT = lineaEditada.PRECIO_BGT;

    } catch (e) {
        console.error("Error actualizando cache forecast", e);
    }
}

function onChangeCantidad(i) {
    try {
        if (!rolEditarForecast) {
            return;
        }
        if (debounceTimers[i]) clearTimeout(debounceTimers[i]);

        debounceTimers[i] = setTimeout(() => {

            try {

                // === BUSCAR LA FILA REAL EN PRODCADENA ===

                let row = $(`tr[data-row='${i}']`);
                let idxReal = row.data("idxreal");

                if (idxReal === undefined || idxReal < 0) {
                    Swal.fire({ icon: "error", text: "Índice real inválido" });
                    return;
                }

                if (idxReal === -1) {
                    Swal.fire({ icon: "error", text: "No se encontró la línea correcta" });
                    return;
                }

                const meses = MESES;
                let total = 0;
                let error = false;

                meses.forEach(mes => {

                    const idInput = `#${i}_${mes}`;
                    let valor = $(idInput).val().trim();

                    if (valor === "" || isNaN(valor) || valor < 0) {
                        Swal.fire({ icon: "error", text: `El valor de ${mes} debe ser 0 o mayor` });
                        $(idInput).val("0");
                        valor = 0;
                        error = true;
                    }

                    valor = parseFloat(parseFloat(valor).toFixed(2));

                    // === ACTUALIZA LA LÍNEA REAL ===
                    ProdCadena[idxReal][mes + "_CANT"] = valor;

                    total += valor;
                });

                ProdCadena[idxReal].Total = total;
                ProdCadena[idxReal].Revisado = true;
                let itemCliente = ProdClientes.find(a => a.id == ProdCadena[idxReal].id);

                if (itemCliente) {
                    Object.assign(itemCliente, ProdCadena[idxReal]);
                }

                var idPresupuestoSel = $("#PresupuestoSeleccionado").val();
                var Presupuesto = Presupuestos.find(a => a.id == idPresupuestoSel);
                if (Presupuesto.Tipo == "B") {
                    ProdCadena[idxReal].COSTO_BGT = parseFloat(parseFloat($("#" + i + "_COSTO").val()).toFixed(2));
                    ProdCadena[idxReal].PRECIO_BGT = parseFloat(parseFloat($("#" + i + "_PRECIO").val()).toFixed(2));;
                }
                // Color revisado
                $(`tr[data-row='${i}']`).addClass("revisado-row");

                // Actualizar total visual
                $(`tr[data-row='${i}'] .row-total`).text(total.toFixed(0));

                if (!error) {

                    const jsonString = JSON.stringify(ProdCadena[idxReal]);
                    const compressedData = pako.gzip(jsonString);

                    $.ajax({
                        type: 'POST',
                        url: $("#urlGenerar").val(),
                        dataType: 'json',
                        contentType: 'application/json',
                        data: compressedData,
                        processData: false,
                        headers: {
                            RequestVerificationToken: $('input:hidden[name="__RequestVerificationToken"]').val()
                        },
                        success: function (json) {
                            if (json.success) {
                                let linea = ProdCadena[idxReal];

                                // 🔥 ACTUALIZAR CACHE
                                actualizarCacheForecast(ProdCadena[idxReal]);
                                CalcularKPIS();
                            } else {
                                Swal.fire({ icon: "error", text: "Error guardando forecast" });
                            }
                        }
                    });

                    recalcularVariacionUI(i, idxReal);
                }

            } catch (e) {
                Swal.fire({ icon: "error", text: "Error en: " + e });
            }

        }, 600);

    } catch (e) {
        Swal.fire({ icon: "error", text: "Error " + e });
    }
}


function recalcularVariacionUI(i, idxReal) {

    let row = $(`tr[data-row='${i}']`);

    let year = row.data("year");
    let mes = row.data("mes");
    let idCliente = row.data("idcli");
    let idProducto = row.data("idprod");

    // 🔙 Forecast anterior
    let mesAnterior = parseInt(mes) - 1;
    let yearAnterior = year;

    if (mesAnterior === 0) {
        mesAnterior = 12;
        yearAnterior = (parseInt(year) - 1).toString();
    }

    mesAnterior = mesAnterior.toString().padStart(2, "0");

    let forecastAnteriorRaw = ProdCadena.find(x =>
        x.idCliente == idCliente &&
        x.idProducto == idProducto &&
        x.Year == yearAnterior &&
        x.MES == mesAnterior
    );

    let totalActual = calcularTotalAnual(ProdCadena[idxReal]);

    let variacion = 0;

    if (forecastAnteriorRaw) {
        let anteriorClonado = JSON.parse(JSON.stringify(forecastAnteriorRaw));
        let totalAnterior = calcularTotalAnual(anteriorClonado);

        if (totalAnterior > 0) {
            variacion = ((totalActual - totalAnterior) / totalAnterior) * 100;
        }
    }

    // Persistir
    ProdCadena[idxReal].Total = totalActual;
    ProdCadena[idxReal].Variacion = variacion;

    // 🎯 ACTUALIZAR UI
    let claseVariacion = Math.abs(variacion || 0) > 15 ? "var-alert" : "";

    $(`#${i}_var`).html(
        `<span class="${claseVariacion}">${variacion.toFixed(0)}%</span>`
    );
}

async function onChangeCantidadProyectado(indexFila, yearKey) {
    try {
        if (!rolEditarForecast) {
            return;
        }
        let filaActual = obtenerFilaBasePorIndexTabla(indexFila);
        if (!filaActual) return;

        let yearBase = parseInt(filaActual.Year);

        let yearDestino = yearKey === "year1"
            ? yearBase + 1
            : yearBase + 2;

        let presupuestoDestino = Presupuestos.find(p =>
            p.Tipo == "F" &&
            parseInt(p.Year) === yearDestino &&
            parseInt(p.Mes) === 1
        );

        if (!presupuestoDestino) {
            Swal.fire({
                icon: "warning",
                title: "Forecast no encontrado",
                text: `No existe FCT JAN para el año ${yearDestino}`
            });
            return;
        }

        let lineaDestino = ProdCadena.find(x =>
            x.idCliente == filaActual.idCliente &&
            x.idProducto == filaActual.idProducto &&
            parseInt(x.Year) === yearDestino &&
            x.idPresupuesto == presupuestoDestino.id
        );

        if (!lineaDestino) {
            lineaDestino = {
                ...filaActual,
                id: 0,
                idPresupuesto: presupuestoDestino.id,
                Year: yearDestino.toString(),
                MES: "01",
                Revisado: true
            };

            MESES.forEach(m => lineaDestino[m + "_CANT"] = 0);
            ProdCadena.push(lineaDestino);
        }

        let total = 0;

        MESES.forEach(mes => {
            let input = $(`#${indexFila}_${yearKey}_${mes}`);
            if (!input.length) return;

            let valor = parseFloat(
                input.val().toString().replace(/[^0-9.-]+/g, "")
            ) || 0;

            input.attr("data-raw", valor);

            lineaDestino[mes + "_CANT"] = valor;
            total += valor;
        });

        lineaDestino.Total = total;
        lineaDestino.Revisado = true;

        CalcularKPIS();

        // Si la línea no existe en BD, primero hay que crearla
        if (!lineaDestino.id || lineaDestino.id == 0) {
            let objNueva = {
                idCliente: parseInt(lineaDestino.idCliente),
                idProducto: parseInt(lineaDestino.idProducto),
                idPresupuesto: parseInt(lineaDestino.idPresupuesto),
                idVendedor: parseInt(lineaDestino.idVendedor || $("#VendedorSeleccionado").val() || 0)
            };

            let jsonNueva = JSON.stringify(objNueva);
            let gzipNueva = pako.gzip(jsonNueva);
            let uint8Nueva = new Uint8Array(gzipNueva);

            let resp = await $.ajax({
                type: "POST",
                url: $("#urlGenerarLinea").val(),
                data: uint8Nueva,
                processData: false,
                contentType: "application/octet-stream",
                headers: {
                    RequestVerificationToken: $('input:hidden[name="__RequestVerificationToken"]').val()
                }
            });

            if (!resp || !resp.Forecast) {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "No se pudo crear la línea de Year 1"
                });
                return;
            }

            lineaDestino.id = resp.Forecast.id;
            lineaDestino.idPresupuesto = resp.Forecast.idPresupuesto;
            lineaDestino.idBudget = resp.Forecast.idBudget;
            lineaDestino.idSucursal = resp.Forecast.idSucursal;
            lineaDestino.MES = resp.Forecast.MES || "01";

            Forecast.push(resp.Forecast);
        }

        const jsonString = JSON.stringify(lineaDestino);
        const compressedData = pako.gzip(jsonString);

        $.ajax({
            type: "POST",
            url: $("#urlGenerar").val(),
            dataType: "json",
            contentType: "application/json",
            data: compressedData,
            processData: false,
            headers: {
                RequestVerificationToken: $('input:hidden[name="__RequestVerificationToken"]').val()
            },
            success: function (json) {
                if (json.success) {
                    actualizarCacheForecast(lineaDestino);
                    CalcularKPIS();
                } else {
                    Swal.fire({
                        icon: "error",
                        text: "Error guardando Year 1"
                    });
                }
            },
            error: function (err) {
                Swal.fire({
                    icon: "error",
                    title: "Error guardando Year 1",
                    text: err.responseText || err
                });
            }
        });

    } catch (e) {
        console.error("Error onChangeCantidadProyectado:", e);
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Error guardando Year 1: " + e
        });
    }
}


function agregarForecastDesdeModal() {
    try {
        let idCliente = $("#cliente").val();
        let idProducto = $("#producto").val();
        let idPresupuesto = $("#PresupuestoSeleccionado").val();
        let idVendedor = $("#VendedorSeleccionado").val() || 0;

        if (idCliente == 0 || idProducto == 0 || idPresupuesto == 0) {
            Swal.fire({
                icon: "warning",
                title: "Datos incompletos",
                text: "Debe seleccionar Cliente, Producto y Forecast."
            });
            return;
        }

        let obj = {
            idCliente: parseInt(idCliente),
            idProducto: parseInt(idProducto),
            idPresupuesto: parseInt(idPresupuesto),
            idVendedor: parseInt(idVendedor)
        };

        let json = JSON.stringify(obj);
        let gzip = pako.gzip(json);
        let uint8 = new Uint8Array(gzip);

        $.ajax({
            type: "POST",
            url: $("#urlGenerarLinea").val(),
            data: uint8,
            processData: false,
            contentType: "application/octet-stream",
            headers: {
                RequestVerificationToken: $('input:hidden[name="__RequestVerificationToken"]').val()
            },

            success: function (resp) {

                if (!resp || !resp.Forecast) {
                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: "No se recibió la línea correctamente"
                    });
                    return;
                }

                // 🔥 NUEVA LÍNEA PROCESADA (igual que RecuperarInformacion)
                let f = resp.Forecast;

                var PrecioProducto = mapaPrecios[`${f.idProducto}_${f.idCliente}`];
                var PE = Productos.find(a => a.id == f.idProducto);
                let pc = obtenerPrecioYCosto(f);
                let precioFinal = pc?.Precio || 0;

                var nuevaLinea = {

                    id: f.id,
                    idPresupuesto: f.idPresupuesto,
                    idCliente: f.idCliente,
                    idProducto: f.idProducto,
                    idVendedor: f.idVendedor,
                    idBudget: f.idBudget,
                    idSucursal: f.idSucursal,

                    CodigoCliente: f.CodigoCliente,
                    CodigoProducto: f.CodigoProducto,
                    NombreCliente: f.NombreCliente,
                    NombreProducto: PE.Codigo + "-" + PE.Nombre + " PRECIO $" + precioFinal.toFixed(2),

                    Year: f.Year,
                    MES: f.MES,

                    ENERO_CANT: 0,
                    FEBRERO_CANT: 0,
                    MARZO_CANT: 0,
                    ABRIL_CANT: 0,
                    MAYO_CANT: 0,
                    JUNIO_CANT: 0,
                    JULIO_CANT: 0,
                    AGOSTO_CANT: 0,
                    SETIEMBRE_CANT: 0,
                    OCTUBRE_CANT: 0,
                    NOVIEMBRE_CANT: 0,
                    DICIEMBRE_CANT: 0,

                    PRECIO: f.PRECIO,
                    COSTO: f.COSTO,

                    CLASIFICACION_1: f.CLASIFICACION_1,
                    CLASIFICACION_2: f.CLASIFICACION_2,
                    CLASIFICACION_3: f.CLASIFICACION_3,

                    COSTO_BGT: f.COSTO_BGT ?? 0,
                    PRECIO_BGT: f.PRECIO_BGT ?? 0,

                    Precio: pc.Precio,
                    Costo: pc.Costo,

                    Venta: 0,
                    Factor: PE?.Factor ?? 1,
                    Total: 0,
                    Variacion: 0,
                    Revisado: false,

                    idMarca: PE?.idMarca ?? 0,
                    idGrupo: PE?.idGrupo ?? 0,
                    idIngrediente: PE?.idIngrediente ?? 0
                };

                // 🔥 INSERTAR EN MEMORIA
                ProdCadena.push(nuevaLinea);
                Forecast.push(resp.Forecast);

                // 🔥 2. LIMPIAR CACHE (CRÍTICO)
                let vendedor = parseInt($("#VendedorSeleccionado").val()) || 0;
                let sucursal = parseInt($("#SucursalSeleccionada").val()) || 0;
                let idPresupuesto = $("#PresupuestoSeleccionado").val();

                let cacheKey = `${idPresupuesto}_${vendedor}_${sucursal}`;
                delete cacheForecast[cacheKey];
                // 🔥 REFRESCAR TABLA (sin recargar todo)
                onChangeFiltroInterno();

                // 🔥 cerrar modal
                $("#formModal").modal("hide");
                $(".modal-backdrop").remove();
                $("body").removeClass("modal-open");
                $("body").css("overflow", "auto");

                Swal.fire({
                    icon: "success",
                    title: "Línea agregada",
                    timer: 1200,
                    showConfirmButton: false
                });
            },

            error: function (err) {
                Swal.fire({
                    icon: "error",
                    title: "Oops...",
                    text: "Error al insertar línea: " + err.responseText
                });
            }
        });

    } catch (e) {
        Swal.fire({
            icon: "error",
            title: "Error interno",
            text: e
        });
    }
}




function RellenaPresupuestos() {
    try {

        function getFechaDesdeCodigo(codigo) {
            try {
                let mesStr = codigo.substring(3, 6).toUpperCase();
                let yearStr = codigo.substring(6, 8);

                const meses = {
                    JAN: 1, FEB: 2, MAR: 3, APR: 4,
                    MAY: 5, JUN: 6, JUL: 7, AUG: 8,
                    SEP: 9, OCT: 10, NOV: 11, DEC: 12
                };

                let mes = meses[mesStr];
                if (!mes) return new Date(0);

                let year = 2000 + parseInt(yearStr);

                return new Date(year, mes - 1);
            } catch {
                return new Date(0);
            }
        }

        // 🔥 ORDENAR (más nuevo primero)
        Presupuestos.sort((a, b) => {
            let fechaA = getFechaDesdeCodigo(a.Codigo || "");
            let fechaB = getFechaDesdeCodigo(b.Codigo || "");
            return fechaB - fechaA;
        });

        // 🔥 FECHA ACTUAL
        let hoy = new Date();
        let yearActual = hoy.getFullYear();
        let mesActual = hoy.getMonth(); // 0-11

        // 🔥 BUSCAR PRESUPUESTO DEL MES ACTUAL
        let presupuestoSeleccionado = null;

        for (let i = 0; i < Presupuestos.length; i++) {
            let fecha = getFechaDesdeCodigo(Presupuestos[i].Codigo || "");

            if (
                fecha.getFullYear() === yearActual &&
                fecha.getMonth() === mesActual
            ) {
                presupuestoSeleccionado = Presupuestos[i];
                break;
            }
        }

        // 🔥 SI NO HAY DEL MES → TOMAR EL MÁS RECIENTE (ya ordenado)
        if (!presupuestoSeleccionado && Presupuestos.length > 0) {
            presupuestoSeleccionado = Presupuestos[0];
        }

        // 🔥 CONSTRUIR HTML
        let html = "";

        for (let i = 0; i < Presupuestos.length; i++) {
            let selected = "";

            if (presupuestoSeleccionado && Presupuestos[i].id === presupuestoSeleccionado.id) {
                selected = "selected";
            }

            html += `<option value='${Presupuestos[i].id}' ${selected}>
                        ${Presupuestos[i].Codigo}
                     </option>`;
        }

        // 🔥 REFRESCAR SELECT2
        $("#PresupuestoSeleccionado").select2('destroy');
        $("#PresupuestoSeleccionado").html(html);
        $("#PresupuestoSeleccionado").select2();

    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error ' + e
        });
    }
}

function RellenaVendedores() {
    try {
        var html = "";
        $("#VendedorSeleccionado").html(html);
        if ($("#RolTodosVendedor").val() == "value") {
            html += "<option value='0' > Seleccione Vendedor </option>";
        }
        for (var i = 0; i < Vendedores.length; i++) {
            html += "<option value='" + Vendedores[i].id + "' > " + Vendedores[i].Codigo + ' - ' + Vendedores[i].Nombre + " </option>";
        }



        $("#VendedorSeleccionado").html(html);
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
        html += "<option value='0'> Seleccione Producto </option>";

        if (!ProdClientes || ProdClientes.length === 0) {
            $("#ProductoSeleccionado").html(html);
            return;
        }

        let idPresupuesto = parseInt($("#PresupuestoSeleccionado").val()) || 0;
        let idSucursal = parseInt($("#SucursalSeleccionada").val()) || 0;
        let idVendedor = parseInt($("#VendedorSeleccionado").val()) || 0;

        let seleccionado = $("#ProductoSeleccionado").val();

        // 🔥 FILTRO IGUAL QUE TU QUERY
        let data = ProdClientes.filter(x =>
            parseInt(x.idPresupuesto) === idPresupuesto &&
            parseInt(x.idSucursal) === idSucursal &&
            parseInt(x.idVendedor) === idVendedor
        );

        let productosIds = [...new Set(data.map(x => parseInt(x.idProducto)))];

        for (var i = 0; i < Productos.length; i++) {

            let idProducto = parseInt(Productos[i].id);

            if (productosIds.includes(idProducto)) {
                html += "<option value='" + Productos[i].id + "' > "
                    + Productos[i].Codigo + " - "
                    + Productos[i].Nombre + " </option>";
            }
        }

        $("#ProductoSeleccionado").html(html);

        // 🔥 mantener selección si aún existe
        if (productosIds.includes(parseInt(seleccionado))) {
            $("#ProductoSeleccionado").val(seleccionado);
        }

    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error ' + e
        });
    }
}

function RellenaMarcas() {
    try {

        var html = "";
        $("#MarcaSeleccionado").html(html);
        html += "<option value='0'> Seleccione Marca </option>";

        if (!ProdClientes || ProdClientes.length === 0) {
            $("#MarcaSeleccionado").html(html);
            return;
        }

        let idPresupuesto = parseInt($("#PresupuestoSeleccionado").val()) || 0;
        let idSucursal = parseInt($("#SucursalSeleccionada").val()) || 0;
        let idVendedor = parseInt($("#VendedorSeleccionado").val()) || 0;

        let seleccionado = $("#MarcaSeleccionado").val();

        // 🔥 FILTRO BASE (como tu query)
        let data = ProdClientes.filter(x =>
            parseInt(x.idPresupuesto) === idPresupuesto &&
            parseInt(x.idSucursal) === idSucursal &&
            parseInt(x.idVendedor) === idVendedor
        );

        // 🔥 productos válidos
        let productosIds = [...new Set(data.map(x => parseInt(x.idProducto)))];

        // 🔥 mapear a marcas desde Productos
        let marcasIds = [...new Set(
            Productos
                .filter(p => productosIds.includes(parseInt(p.id)))
                .map(p => parseInt(p.idMarca))
        )];

        for (var i = 0; i < Marcas.length; i++) {

            let idMarca = parseInt(Marcas[i].id);

            if (marcasIds.includes(idMarca)) {
                html += "<option value='" + Marcas[i].id + "' > "
                    + Marcas[i].Nombre + " </option>";
            }
        }

        $("#MarcaSeleccionado").html(html);

        // 🔥 mantener selección
        if (marcasIds.includes(parseInt(seleccionado))) {
            $("#MarcaSeleccionado").val(seleccionado);
        }

    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error ' + e
        });
    }
}

function RellenaGrupos() {
    try {

        var html = "";
        $("#GrupoSeleccionado").html(html);
        html += "<option value='0'> Seleccione Grupo </option>";

        if (!ProdClientes || ProdClientes.length === 0) {
            $("#GrupoSeleccionado").html(html);
            return;
        }

        let idPresupuesto = parseInt($("#PresupuestoSeleccionado").val()) || 0;
        let idSucursal = parseInt($("#SucursalSeleccionada").val()) || 0;
        let idVendedor = parseInt($("#VendedorSeleccionado").val()) || 0;

        let seleccionado = $("#GrupoSeleccionado").val();

        // 🔥 FILTRO BASE (como query)
        let data = ProdClientes.filter(x =>
            parseInt(x.idPresupuesto) === idPresupuesto &&
            parseInt(x.idSucursal) === idSucursal &&
            parseInt(x.idVendedor) === idVendedor
        );

        // 🔥 obtener productos válidos
        let productosIds = [...new Set(data.map(x => parseInt(x.idProducto)))];

        // 🔥 mapear a grupos desde Productos
        let gruposIds = [...new Set(
            Productos
                .filter(p => productosIds.includes(parseInt(p.id)))
                .map(p => parseInt(p.idGrupo))
        )];

        for (var i = 0; i < Grupos.length; i++) {

            let idGrupo = parseInt(Grupos[i].id);

            if (gruposIds.includes(idGrupo)) {
                html += "<option value='" + Grupos[i].id + "' > "
                    + Grupos[i].Nombre + " </option>";
            }
        }

        $("#GrupoSeleccionado").html(html);

        // 🔥 mantener selección
        if (gruposIds.includes(parseInt(seleccionado))) {
            $("#GrupoSeleccionado").val(seleccionado);
        }

    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error ' + e
        });
    }
}

function RellenaIngredientes() {
    try {

        var html = "";
        $("#IngredienteSeleccionado").html(html);
        html += "<option value='0'> Seleccione Ingrediente </option>";

        if (!ProdClientes || ProdClientes.length === 0) {
            $("#IngredienteSeleccionado").html(html);
            return;
        }

        let idPresupuesto = parseInt($("#PresupuestoSeleccionado").val()) || 0;
        let idSucursal = parseInt($("#SucursalSeleccionada").val()) || 0;
        let idVendedor = parseInt($("#VendedorSeleccionado").val()) || 0;

        let seleccionado = $("#IngredienteSeleccionado").val();

        // 🔥 FILTRO BASE (igual que tu query)
        let data = ProdClientes.filter(x =>
            parseInt(x.idPresupuesto) === idPresupuesto &&
            parseInt(x.idSucursal) === idSucursal &&
            parseInt(x.idVendedor) === idVendedor
        );

        // 🔥 productos válidos
        let productosIds = [...new Set(data.map(x => parseInt(x.idProducto)))];

        // 🔥 mapear ingredientes desde Productos
        let ingredientesIds = [...new Set(
            Productos
                .filter(p => productosIds.includes(parseInt(p.id)))
                .map(p => parseInt(p.idIngrediente))
        )];

        for (var i = 0; i < Ingredientes.length; i++) {

            let idIngrediente = parseInt(Ingredientes[i].id);

            if (ingredientesIds.includes(idIngrediente)) {
                html += "<option value='" + Ingredientes[i].id + "' > "
                    + Ingredientes[i].Nombre + " </option>";
            }
        }

        $("#IngredienteSeleccionado").html(html);

        // 🔥 mantener selección si aún existe
        if (ingredientesIds.includes(parseInt(seleccionado))) {
            $("#IngredienteSeleccionado").val(seleccionado);
        }

    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error ' + e
        });
    }
}

function RellenaClientes() {
    try {
        var html = "";
        var idVendedor = $("#VendedorSeleccionado").val();

        // 🔥 FILTRAR POR VENDEDOR + FORECAST REAL
        var data = ProdCadena.filter(a =>
            (idVendedor == 0 || a.idVendedor == idVendedor)
        );

        // 🔥 SACAR IDS VÁLIDOS
        var idsClientes = [...new Set(data.map(a => a.idCliente))];

        // 🔥 FILTRAR LISTA ORIGINAL
        var ClientesVendedor = Clientes.filter(a =>
            idsClientes.includes(a.id)
        );

        $("#ClienteSeleccionado").html(html);
        html += "<option value='0' > Seleccione Cliente </option>";

        for (var i = 0; i < ClientesVendedor.length; i++) {
            html += "<option value='" + ClientesVendedor[i].id + "' > "
                + ClientesVendedor[i].Codigo + " - "
                + ClientesVendedor[i].Nombre + " </option>";
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

function RellenaClientesModal() {
    try {
        var html = "";
        var idVendedor = $("#VendedorSeleccionado").val();
        var ClientesVendedor = Clientes.filter(a => a.idVendedor == idVendedor);
        $("#cliente").html(html);
        html += "<option value='0' > Seleccione Cliente </option>";

        for (var i = 0; i < ClientesVendedor.length; i++) {
            html += "<option value='" + ClientesVendedor[i].id + "' > " + ClientesVendedor[i].Codigo + " - " + ClientesVendedor[i].Nombre + " </option>";
        }



        $("#cliente").html(html);
        $("#cliente").select2({
            dropdownParent: $('#formModal'), // necesario para que funcione dentro del modal
            width: '100%'
        });
        $("#producto").select2({
            dropdownParent: $('#formModal'), // necesario para que funcione dentro del modal
            width: '100%'
        });
    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error ' + e

        })
    }

}
//function SmartSearchTable() { try { const q = ($("#smart-search").val() || "").toLowerCase().trim(); if (!ProdClientesBase || ProdClientesBase.length === 0) return; if (q === "") { ProdClientes = [...ProdClientesBase]; paginaActual = 1; RellenaTabla(); CalcularKPIS(); return; } const dataFiltrada = ProdClientesBase.filter(a => { let texto = (a.NombreCliente || "") + " " + (a.NombreProducto || "") + " " + (a.CodigoCliente || "") + " " + (a.CodigoProducto || ""); return texto.toLowerCase().includes(q); }); ProdClientes = dataFiltrada; paginaActual = 1; RellenaTabla(); CalcularKPIS(); } catch (e) { Swal.fire({ icon: 'error', title: 'Oops...', text: 'Error ' + e }); } }
function toggleFullscreen() {
    try {
        const elem = document.documentElement;
        const icon = document.getElementById("fullscreen-icon");
        const btn = document.getElementById("btn-fullscreen");

        if (!document.fullscreenElement) {
            // Entrar a pantalla completa
            elem.requestFullscreen().then(() => {
                icon.classList.remove("fa-expand");
                icon.classList.add("fa-compress");

                btn.classList.add("active"); // ← agregar clase activa
            });
        } else {
            // Salir de pantalla completa
            document.exitFullscreen().then(() => {
                icon.classList.remove("fa-compress");
                icon.classList.add("fa-expand");

                btn.classList.remove("active");
                // ← remover clase activa
            });
        }
    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error ' + e

        })
    }

}
function SmartSearchTable() {
    try {

        searchTexto = ($("#smart-search").val() || "").toLowerCase().trim();

        paginaActual = 1;

        RellenaTabla();   // 🔥 SOLO re-render


    } catch (e) {
        console.error(e);
    }
}
function setModo(modo) {
    try {
        modoAnterior = modoActual;
        modoActual = modo;

        const btnUnits = document.getElementById("btn-unit");
        const btnKG = document.getElementById("btn-kgl");
        const btnUSD = document.getElementById("btn-dolares");
        const btnUnequal = document.getElementById("btn-unequal");

        // limpiar clases
        btnUnits.classList.remove("active");
        btnKG.classList.remove("active");
        btnUSD.classList.remove("active");
        btnUnequal.classList.remove("active");

        if (modo === "units") btnUnits.classList.add("active");
        if (modo === "kg") btnKG.classList.add("active");
        if (modo === "usd") btnUSD.classList.add("active");
        if (modo === "15") btnUnequal.classList.add("active");

        paginaActual = 1;
        RellenaTabla();

        if ($("#PresupuestoSeleccionado").val() != 0) {
            CalcularKPIS();
        }
    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error ' + e

        })
    }

}


function actualizarVistaModo() {
    try {

        for (let i = 0; i < ProdClientes.length; i++) {

            const p = ProdClientes[i] || {};
            const factor = parseFloat(p.Factor || 1);
            const precio = parseFloat(p.Precio || 0);

            let row = $(`tr[data-row='${i}']`);
            if (!row.length) continue;

            // 🔥 BUSCAR LA LINEA REAL (NO idxReal)
            let linea = ProdCadena.find(x =>
                x.idCliente == p.idCliente &&
                x.idProducto == p.idProducto &&
                x.Year == p.Year &&
                x.MES == p.MES
            );

            if (!linea) {
                console.warn("⚠️ No se encontró linea real", p);
                continue;
            }

            let totalUnits = 0;

            if (modoActual === "15") {

                if (!(p.Variacion > 15 || p.Variacion < -15)) {
                    row.hide();
                    continue;
                } else {
                    row.show();
                }

            } else {
                row.show();
            }

            MESES.forEach(mes => {

                const id = `${i}_${mes}`;
                const $td = $("#" + id).closest("td");
                if (!$td.length) return;

                const key = mes + "_CANT";
                const cantidad = parseFloat(linea[key] || 0);

                totalUnits += cantidad;

                let valorMostrar;
                let disabledAttr = "";

                if (modoActual === "kg") {
                    valorMostrar = formatearNumero(cantidad * factor);
                    disabledAttr = "disabled";

                } else if (modoActual === "usd") {
                    let total = cantidad * precio;
                    valorMostrar = `$${formatoDecimal((total || 0).toFixed(0))}`;
                    disabledAttr = "disabled";

                } else {
                    valorMostrar = formatearNumero(cantidad);
                    disabledAttr = MesDebeIrDisabled(mesNumero(mes)) ? "disabled" : "";
                }

                $td.html(`
                    <input 
                        id="${id}"
                        class="month-input"
                        value="${valorMostrar}"
                        ${disabledAttr}
                    />
                `);

                if (modoActual === "units") {
                    $("#" + id).off("input").on("input", function () {
                        onChangeCantidad(i);
                    });
                }

            });

            const $totalCell = row.find(".row-total");

            if (modoActual === "kg") {
                $totalCell.text(formatearNumero(totalUnits * factor));
            } else if (modoActual === "usd") {
                $totalCell.text(`$${formatoDecimal((totalUnits * precio || 0).toFixed(0))}`);
            } else {
                $totalCell.text(formatearNumero(totalUnits));
            }

            actualizarDetalleExpandible(i, factor, precio);
        }

    } catch (e) {
        console.error("💥 ERROR GENERAL", e);

        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error ' + e
        });
    }
}
function irAObservarPresupuesto() {
    try {
        let idPresupuesto = $("#PresupuestoSeleccionado").val();
        let idVendedor = $("#VendedorSeleccionado").val() || 0;

        if (!idPresupuesto || idPresupuesto == 0) {
            Swal.fire({
                icon: "warning",
                title: "Seleccione Forecast",
                text: "Debe seleccionar un presupuesto antes de observar."
            });
            return;
        }

        window.location.href = `/Presupuestos/Observar/${idPresupuesto}?filtro.Codigo2=${idVendedor}&id=${idPresupuesto}`;

    } catch (e) {
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Error redirigiendo: " + e
        });
    }
}
function actualizarDetalleExpandible(i, factor, precio) {
    try {
        const modos = {
            kg: val => val * factor,
            usd: val => val * precio,
            units: val => val,
            "15": val => val
        };

        const transform = modos[modoActual];

        const permitirEditarProyectados =
            rolEditarForecast && (modoActual === "units" || modoActual === "15");

        const $rows = $(`#details-${i} .detail-inner tr`);

        $rows.each(function () {

            const esProyectado =
                $(this).hasClass("band-year1") ||
                $(this).hasClass("band-year2");

            let total = 0;

            $(this).find("input").each(function () {

                // 🔥 USAR DATA-RAW (CLAVE)
                let original = parseFloat($(this).attr("data-raw")) || 0;

                const transformed = transform(original);
                total += transformed;

                if (modoActual === "usd") {
                    $(this).val(`$${formatoDecimal(transformed.toFixed(0))}`);
                } else {
                    $(this).val(formatearNumero(transformed.toFixed(0)));
                }

                if (esProyectado) {

                    let bloquear = false;

                    let idPresupuesto = $("#PresupuestoSeleccionado").val();
                    let MiPresupuesto = Presupuestos.find(a => a.id == idPresupuesto);
                    let mesForecast = MiPresupuesto ? parseInt(MiPresupuesto.Mes) : 0;

                    let idInput = $(this).attr("id");

                    if (idInput) {

                        let partes = idInput.split("_");
                        let nombreMesInput = partes[2];

                        if (
                            $(this).closest("tr").hasClass("band-year1") &&
                            mesForecast === 12 &&
                            nombreMesInput === "ENERO"
                        ) {
                            bloquear = true;
                        }
                    }

                    if (!permitirEditarProyectados) {
                        $(this).attr("disabled", "disabled");
                    } else {
                        bloquear
                            ? $(this).attr("disabled", "disabled")
                            : $(this).removeAttr("disabled");
                    }
                }
            });

            const $totalCell = $(this).find(".detail-total");

            if ($totalCell.length) {
                if (modoActual === "usd") {
                    $totalCell.text(`$${formatoDecimal(total.toFixed(0))}`);
                } else {
                    $totalCell.text(formatearNumero(total));
                }
            }
        });

    } catch (e) {
        Swal.fire({ icon: 'error', title: 'Oops...', text: 'Error ' + e });
    }
}





// Utilidad para convertir nombre de mes a número
function mesNumero(nombre) {
    try {
        const m = {
            "ENERO": 1, "FEBRERO": 2, "MARZO": 3, "ABRIL": 4,
            "MAYO": 5, "JUNIO": 6, "JULIO": 7, "AGOSTO": 8,
            "SETIEMBRE": 9, "OCTUBRE": 10, "NOVIEMBRE": 11, "DICIEMBRE": 12
        };
        return m[nombre];
    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error ' + e

        })
    }

}

function formatearNumero(num) {
    try {
        num = parseFloat(num);
        if (isNaN(num)) return "0";
        return (num % 1 === 0) ? num.toString() : num.toFixed(2);
    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error ' + e

        })
    }

}
function aplicarModoADatos(data) {

    return data.map(p => {

        let copia = { ...p };

        let total = calcularTotalAnual(p);

        if (modoActual === "kg") {
            copia.Total = total * (p.Factor || 1);
        }
        else if (modoActual === "usd") {
            copia.Total = total * (p.Precio || 0);
        }
        else {
            copia.Total = total;
        }

        return copia;
    });
}
function cambiarPagina(direccion) {

    let dataBase = obtenerDataSegunModo();
    let dataFiltrada = aplicarModoADatos(dataBase);
    // 🔥 APLICAR SEARCH AQUÍ (DESPUÉS DEL CÁLCULO)
    if (searchTexto && searchTexto !== "") {

        dataFiltrada = dataFiltrada.filter(a => {

            let texto =
                (a.NombreCliente || "") + " " +
                (a.NombreProducto || "") + " " +
                (a.CodigoCliente || "") + " " +
                (a.CodigoProducto || "");

            return texto.toLowerCase().includes(searchTexto);
        });
    }
    let totalPaginas = Math.ceil(dataFiltrada.length / filasPorPagina) || 1;

    paginaActual += direccion;

    if (paginaActual < 1) paginaActual = 1;
    if (paginaActual > totalPaginas) paginaActual = totalPaginas;

    actualizarInfoPagina();
    RellenaTabla();
}
function actualizarInfoPagina() {

    let total = obtenerDataSegunModo().length;
    let totalPaginas = Math.ceil(total / filasPorPagina) || 1;

    $("#paginaInfo").text(`Página ${paginaActual} de ${totalPaginas}`);
}

document.addEventListener("click", function (e) {

    let toggle = e.target.closest('[data-bs-toggle="dropdown"]');

    if (toggle) {
        e.stopPropagation();

        let dropdown = bootstrap.Dropdown.getOrCreateInstance(toggle);
        dropdown.toggle();
    }

});

function cambiarOrdenTabla(columna) {
    try {
        if (ordenTabla.columna === columna) {
            ordenTabla.direccion = ordenTabla.direccion === "asc" ? "desc" : "asc";
        } else {
            ordenTabla.columna = columna;
            ordenTabla.direccion = "asc";
        }

        paginaActual = 1;
        RellenaTabla();
    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Error ordenando tabla ' + e
        });
    }
}

function aplicarOrdenTabla(data) {
    try {
        if (!ordenTabla.columna) return data;

        const direccion = ordenTabla.direccion === "desc" ? -1 : 1;
        const texto = (valor) => (valor || "").toString().toLowerCase().trim();
        const numero = (valor) => {
            const n = parseFloat(valor);
            return isNaN(n) ? 0 : n;
        };

        return [...data].sort((a, b) => {
            let resultado = 0;

            switch (ordenTabla.columna) {
                case "cliente":
                    resultado = texto(a.NombreCliente).localeCompare(texto(b.NombreCliente));
                    if (resultado === 0) resultado = texto(a.CodigoCliente).localeCompare(texto(b.CodigoCliente));
                    break;

                case "sku":
                    resultado = texto(a.NombreProducto).localeCompare(texto(b.NombreProducto));
                    if (resultado === 0) resultado = texto(a.CodigoProducto).localeCompare(texto(b.CodigoProducto));
                    break;

                case "total":
                    resultado = numero(a.Total) - numero(b.Total);
                    break;

                case "variacion":
                    resultado = numero(a.Variacion) - numero(b.Variacion);
                    break;
                case "variacionBGT":
                    resultado = numero(a.VariacionBGT) - numero(b.VariacionBGT);
                    break;
            }

            return resultado * direccion;
        });
    } catch (e) {
        console.error(e);
        return data;
    }
}

function actualizarBotonesOrden() {
    try {
        $(".sort-btn").each(function () {
            const columna = $(this).data("sort");
            const activo = columna === ordenTabla.columna;
            const icono = !activo
                ? "fa-sort"
                : ordenTabla.direccion === "desc"
                    ? "fa-sort-down"
                    : "fa-sort-up";

            $(this)
                .toggleClass("active", activo)
                .attr("title", activo
                    ? `Orden ${ordenTabla.direccion === "asc" ? "ascendente" : "descendente"}`
                    : "Ordenar");

            $(this).find("i")
                .removeClass("fa-sort fa-sort-up fa-sort-down")
                .addClass(icono);
        });
    } catch (e) {
        console.error(e);
    }
}