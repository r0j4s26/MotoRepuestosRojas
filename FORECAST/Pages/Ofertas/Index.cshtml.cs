using FORECAST.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Newtonsoft.Json;
using Refit;
using Sicsoft.Checkin.Web.Servicios;
using System.Security.Claims;
using System.Threading.Tasks;
using System;
using MotoRepuestosRojas.Models;
using System.Linq;

namespace MotoRepuestosRojas.Pages.Ofertas
{
    public class IndexModel : PageModel
    {
        private readonly ICrudApi<OfertasViewModel, int> service;

        private readonly ICrudApi<ClientesViewModel, string> clientes;
        private readonly ICrudApi<CondicionesPagosViewModel, int> condiciones;




        [BindProperty]
        public OfertasViewModel[] Listas { get; set; }

        [BindProperty]
        public ClientesViewModel[] Clientes { get; set; }


        [BindProperty]
        public CondicionesPagosViewModel[] Condicion { get; set; }





        [BindProperty(SupportsGet = true)]
        public ParametrosFiltros filtro { get; set; }

        public IndexModel(ICrudApi<OfertasViewModel, int> service, ICrudApi<ClientesViewModel, string> clientes, ICrudApi<CondicionesPagosViewModel, int> condiciones)
        {
            this.service = service;
            this.clientes = clientes;
            this.condiciones = condiciones;


        }

        public async Task<IActionResult> OnGetAsync()
        {
            try
            {
                var Roles1 = ((ClaimsIdentity)User.Identity).Claims.Where(d => d.Type == "Roles").Select(s1 => s1.Value).FirstOrDefault().Split("|");
                if (string.IsNullOrEmpty(Roles1.Where(a => a == "1").FirstOrDefault()))
                {
                    return RedirectToPage("/NoPermiso");
                }
                DateTime time = new DateTime();

                if (time == filtro.FechaInicial)
                {


                    filtro.FechaInicial = DateTime.Now;

                    filtro.FechaInicial = new DateTime(filtro.FechaInicial.Year, filtro.FechaInicial.Month, 1);


                    DateTime primerDia = new DateTime(filtro.FechaInicial.Year, filtro.FechaInicial.Month, 1);


                    DateTime ultimoDia = primerDia.AddMonths(1).AddDays(-1);

                    filtro.FechaFinal = ultimoDia;
                    filtro.ItemCode = "0";



                }

                Listas = await service.ObtenerLista(filtro);




                Clientes = await clientes.ObtenerLista("");
                Condicion = await condiciones.ObtenerLista("");


                return Page();
            }
            catch (ApiException ex)
            {
                Errores error = JsonConvert.DeserializeObject<Errores>(ex.Content.ToString());
                ModelState.AddModelError(string.Empty, error.Message);

                return Page();
            }
            catch (Exception ex)
            {
                ModelState.AddModelError(string.Empty, ex.Message);

                return Page();
            }
        }

        public async Task<IActionResult> OnGetEliminar(int id)
        {
            try
            {

                await service.Eliminar(id);
                return new JsonResult(true);
            }
            catch (ApiException ex)
            {
                return new JsonResult(false);
            }
            catch (Exception ex)
            {
                return new JsonResult(false);
            }
        }

    }
}
