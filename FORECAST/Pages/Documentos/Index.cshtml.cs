using FORECAST.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using MotoRepuestosRojas.Models;
using Newtonsoft.Json;
using Refit;
using Sicsoft.Checkin.Web.Servicios;
using Sicsoft.CostaRica.Checkin.Web.Models;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;


namespace MotoRepuestosRojas.Pages.Documentos
{
    public class IndexModel : PageModel
    {
        private readonly ICrudApi<DocumentosViewModel, int> service;

        private readonly ICrudApi<ClientesViewModel, string> clientes;
        private readonly ICrudApi<CondicionesPagosViewModel, int> condiciones;




        [BindProperty]
        public DocumentosViewModel[] Listas { get; set; }

        [BindProperty]
        public ClientesViewModel[] Clientes { get; set; }


        [BindProperty]
        public CondicionesPagosViewModel[] Condicion { get; set; }




        [BindProperty(SupportsGet = true)]
        public ParametrosFiltros filtro { get; set; }

        public IndexModel(ICrudApi<DocumentosViewModel, int> service, ICrudApi<ClientesViewModel, string> clientes, ICrudApi<CondicionesPagosViewModel, int> condiciones)
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
                if (string.IsNullOrEmpty(Roles1.Where(a => a == "20").FirstOrDefault()))
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