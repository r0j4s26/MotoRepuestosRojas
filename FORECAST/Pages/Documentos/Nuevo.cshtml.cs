using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using FORECAST.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Configuration;
using MotoRepuestosRojas.Models;
using Newtonsoft.Json;
using Refit;
using Sicsoft.Checkin.Web.Servicios;


namespace MotoRepuestosRojas.Pages.Documentos
{
    public class NuevoModel : PageModel
    {
        private readonly ICrudApi<DocumentosViewModel, int> service; //API
        private readonly ICrudApi<ClientesViewModel, string> clientes;
        private readonly ICrudApi<ProductosViewModel, int> productos;
        private readonly ICrudApi<CantonesViewModel, int> serviceC;
        private readonly ICrudApi<DistritosViewModel, int> serviceD;
        private readonly ICrudApi<BarriosViewModel, int> serviceB;

        private readonly ICrudApi<BodegasViewModel, int> bodegas;
        private readonly ICrudApi<CondicionesPagosViewModel, int> condiciones;
        private readonly ICrudApi<OfertasViewModel, int> serviceO; //API
        private readonly ICrudApi<CuentasBancariasViewModel, int> cuentas;



        [BindProperty]
        public DocumentosViewModel Documento { get; set; }


        [BindProperty]
        public ClientesViewModel[] Clientes { get; set; }

        [BindProperty]
        public ProductosViewModel[] Productos { get; set; }
        [BindProperty]
        public CantonesViewModel[] Cantones { get; set; }

        [BindProperty]
        public DistritosViewModel[] Distritos { get; set; }

        [BindProperty]
        public BarriosViewModel[] Barrios { get; set; }




        [BindProperty]
        public decimal Descuento { get; set; }

        [BindProperty]
        public int idVendedor { get; set; }


        [BindProperty]
        public BodegasViewModel[] Bodega { get; set; }


        [BindProperty]
        public CondicionesPagosViewModel[] Condicion { get; set; }



        [BindProperty]
        public int BaseEntry { get; set; }

        [BindProperty]
        public CuentasBancariasViewModel[] CuentasBancarias { get; set; }

        public NuevoModel(ICrudApi<DocumentosViewModel, int> service, ICrudApi<CuentasBancariasViewModel, int> cuentas, ICrudApi<ClientesViewModel, string> clientes, ICrudApi<ProductosViewModel, int> productos, ICrudApi<CantonesViewModel, int> serviceC, ICrudApi<DistritosViewModel, int> serviceD, ICrudApi<BarriosViewModel, int> serviceB, ICrudApi<BodegasViewModel, int> bodegas, ICrudApi<CondicionesPagosViewModel, int> condiciones,  ICrudApi<OfertasViewModel, int> serviceO) //CTOR 
        {
            this.service = service;

            this.clientes = clientes;
            this.productos = productos;
            this.serviceC = serviceC;
            this.serviceD = serviceD;
            this.serviceB = serviceB;
            this.cuentas = cuentas;

            this.bodegas = bodegas;
            this.condiciones = condiciones;
            this.serviceO = serviceO;
        }

        public async Task<IActionResult> OnGetAsync(int id)
        {
            try
            {
                var Roles = ((ClaimsIdentity)User.Identity).Claims.Where(d => d.Type == "Roles").Select(s1 => s1.Value).FirstOrDefault().Split("|");
                if (string.IsNullOrEmpty(Roles.Where(a => a == "21").FirstOrDefault()))
                {
                    return RedirectToPage("/NoPermiso");
                }


                if (id != 0)
                {
                    var Oferta = await serviceO.ObtenerPorId(id);
                    Documento = new DocumentosViewModel();
                    Documento.BaseEntry = id;
                    Documento.Fecha = Oferta.Fecha;
                    Documento.idCliente = Oferta.idCliente;
                    Documento.idCondPago = Oferta.idCondPago;
                    Documento.Comentarios = Oferta.Comentarios;
                    Documento.Moneda = Oferta.Moneda;
                    Documento.Subtotal = Oferta.Subtotal;
                    Documento.TotalImpuestos = Oferta.TotalImpuestos;
                    Documento.TotalDescuentos = Oferta.TotalDescuentos;
                    Documento.TotalCompra = Oferta.TotalCompra;

                    Documento.Comentarios = Oferta.Comentarios + " | Basado en la oferta # " + id;
                    var Tamaño = Oferta.Detalle.Length;
                    Documento.Detalle = new DetDocumentoViewModel[Tamaño];

                    var i = 0;
                    foreach (var item in Oferta.Detalle)
                    {
                        Documento.Detalle[i] = new DetDocumentoViewModel();
                        DetDocumentoViewModel det = new DetDocumentoViewModel();
                        det.idProducto = item.idProducto;
                        det.NumLinea = item.NumLinea;
                        det.Cantidad = item.Cantidad;
                        det.TotalImpuesto = item.TotalImpuesto;
                        det.PrecioUnitario = item.PrecioUnitario;
                        det.PorDescto = item.PorDescto;
                        det.Descuento = item.Descuento;
                        det.TotalLinea = item.TotalLinea;


                        Documento.Detalle[i] = det;
                        i++;
                    }




                }
                else
                {
                    Documento = new DocumentosViewModel();
                }

                ParametrosFiltros filtro = new ParametrosFiltros();



                Clientes = await clientes.ObtenerLista("");
                Clientes = Clientes.Where(a => a.Activo == true).ToArray();

                Productos = await productos.ObtenerLista("");
                Cantones = await serviceC.ObtenerLista("");
                Distritos = await serviceD.ObtenerLista("");
                Barrios = await serviceB.ObtenerLista("");
                BaseEntry = id;

                Bodega = await bodegas.ObtenerLista("");
                Condicion = await condiciones.ObtenerLista("");
                CuentasBancarias = await cuentas.ObtenerLista("");

                return Page();
            }
            catch (Exception ex)
            {

                ModelState.AddModelError(string.Empty, ex.Message);
                return Page();
            }
        }


        public async Task<IActionResult> OnPostAgregarCliente(ClientesViewModel recibidos)
        {
            string error = "";


            try
            {


                var resp = await clientes.Agregar(recibidos);

                var resp2 = new
                {
                    success = true,
                    Cliente = resp
                };
                return new JsonResult(resp2);
            }
            catch (ApiException ex)
            {
                BitacoraErroresViewModel be = JsonConvert.DeserializeObject<BitacoraErroresViewModel>(ex.Content.ToString());

                var resp2 = new
                {
                    success = false,
                    Cliente = be.Descripcion
                };
                return new JsonResult(resp2);
            }
            catch (Exception ex)
            {

                ModelState.AddModelError(string.Empty, ex.Message);
                var resp2 = new
                {
                    success = false,
                    Cliente = ex.Message
                };
                return new JsonResult(resp2);
            }
        }

        public async Task<IActionResult> OnPostAgregarDocumento(DocumentosViewModel recibidos)
        {
            string error = "";


            try
            {

                recibidos.idCaja = Convert.ToInt32(((ClaimsIdentity)User.Identity).Claims.Where(d => d.Type == "idCaja").Select(s1 => s1.Value).FirstOrDefault().ToString());
                recibidos.idUsuarioCreador = Convert.ToInt32(((ClaimsIdentity)User.Identity).Claims.Where(d => d.Type == ClaimTypes.Actor).Select(s1 => s1.Value).FirstOrDefault().ToString());
                var resp = await service.Agregar(recibidos);

                if (recibidos.BaseEntry > 0)
                {
                    await serviceO.Eliminar(recibidos.BaseEntry);

                }

                var resp2 = new
                {
                    success = true,
                    Documento = resp
                };
                return new JsonResult(resp2);
            }
            catch (ApiException ex)
            {
                BitacoraErroresViewModel be = JsonConvert.DeserializeObject<BitacoraErroresViewModel>(ex.Content.ToString());
                var resp2 = new
                {
                    success = false,
                    Documento = be.Descripcion
                };
                return new JsonResult(resp2);

            }
            catch (Exception ex)
            {

                ModelState.AddModelError(string.Empty, ex.Message);
                var resp2 = new
                {
                    success = false,
                    Documento = ex.Message
                };
                return new JsonResult(resp2);
            }
        }


    }
}
