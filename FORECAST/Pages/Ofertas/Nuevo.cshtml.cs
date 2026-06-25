using FORECAST.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using MotoRepuestosRojas.Models;
using Newtonsoft.Json;
using Refit;
using Sicsoft.Checkin.Web.Servicios;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using System;

namespace MotoRepuestosRojas.Pages.Ofertas
{
    public class NuevoModel : PageModel
    {
        private readonly ICrudApi<OfertasViewModel, int> service; //API
        private readonly ICrudApi<ClientesViewModel, string> clientes;
        private readonly ICrudApi<ProductosViewModel, int> productos;
        private readonly ICrudApi<CantonesViewModel, int> serviceC;
        private readonly ICrudApi<DistritosViewModel, int> serviceD;
        private readonly ICrudApi<BarriosViewModel, int> serviceB;

        private readonly ICrudApi<BodegasViewModel, int> bodegas;
        private readonly ICrudApi<CondicionesPagosViewModel, int> condiciones;




        [BindProperty]
        public OfertasViewModel Oferta { get; set; }


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




        public NuevoModel(ICrudApi<OfertasViewModel, int> service, ICrudApi<ClientesViewModel, string> clientes, ICrudApi<ProductosViewModel, int> productos, ICrudApi<CantonesViewModel, int> serviceC, ICrudApi<DistritosViewModel, int> serviceD, ICrudApi<BarriosViewModel, int> serviceB, ICrudApi<BodegasViewModel, int> bodegas, ICrudApi<CondicionesPagosViewModel, int> condiciones) //CTOR 
        {
            this.service = service;

            this.clientes = clientes;
            this.productos = productos;
            this.serviceC = serviceC;
            this.serviceD = serviceD;
            this.serviceB = serviceB;

            this.bodegas = bodegas;
            this.condiciones = condiciones;

        }

        public async Task<IActionResult> OnGetAsync()
        {
            try
            {
                var Roles = ((ClaimsIdentity)User.Identity).Claims.Where(d => d.Type == "Roles").Select(s1 => s1.Value).FirstOrDefault().Split("|");
                if (string.IsNullOrEmpty(Roles.Where(a => a == "1").FirstOrDefault()))
                {
                    return RedirectToPage("/NoPermiso");
                }



                ParametrosFiltros filtro = new ParametrosFiltros();



                Clientes = await clientes.ObtenerLista("");
                Clientes = Clientes.Where(a => a.Activo == true).ToArray();

                Productos = await productos.ObtenerLista("");
                Cantones = await serviceC.ObtenerLista("");
                Distritos = await serviceD.ObtenerLista("");
                Barrios = await serviceB.ObtenerLista("");


                Bodega = await bodegas.ObtenerLista("");
                Condicion = await condiciones.ObtenerLista("");


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

        public async Task<IActionResult> OnPostAgregarOferta(OfertasViewModel recibidos)
        {
            string error = "";


            try
            {
                recibidos.idUsuarioCreador = Convert.ToInt32(((ClaimsIdentity)User.Identity).Claims.Where(d => d.Type == ClaimTypes.Actor).Select(s1 => s1.Value).FirstOrDefault().ToString());
                var resp = await service.Agregar(recibidos);

                var resp2 = new
                {
                    success = true,
                    Oferta = resp
                };
                return new JsonResult(resp2);
            }
            catch (ApiException ex)
            {
                BitacoraErroresViewModel be = JsonConvert.DeserializeObject<BitacoraErroresViewModel>(ex.Content.ToString());
                var resp2 = new
                {
                    success = false,
                    Oferta = be.Descripcion
                };
                return new JsonResult(resp2);

            }
            catch (Exception ex)
            {

                ModelState.AddModelError(string.Empty, ex.Message);
                var resp2 = new
                {
                    success = false,
                    Oferta = ex.Message
                };
                return new JsonResult(resp2);
            }
        }


    }
}
