using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using Refit;
using Sicsoft.Checkin.Web.Servicios;
using FORECAST.Models;

namespace FORECAST.Pages.Clientes
{
    public class EditarModel : PageModel
    {
        private readonly ICrudApi<ClientesViewModel, string> service;
        private readonly ICrudApi<CantonesViewModel, int> serviceC;
        private readonly ICrudApi<DistritosViewModel, int> serviceD;
        private readonly ICrudApi<BarriosViewModel, int> serviceB;
        private readonly ICrudApi<CondicionesPagosViewModel, int> condiciones;



        [BindProperty]
        public ClientesViewModel Cliente { get; set; }

        [BindProperty]
        public CantonesViewModel[] Cantones { get; set; }

        [BindProperty]
        public DistritosViewModel[] Distritos { get; set; }

        [BindProperty]
        public BarriosViewModel[] Barrios { get; set; }


        [BindProperty]
        public CondicionesPagosViewModel[] Condiciones { get; set; }


        public EditarModel(ICrudApi<ClientesViewModel, string> service, ICrudApi<CantonesViewModel, int> serviceC, ICrudApi<DistritosViewModel, int> serviceD, ICrudApi<BarriosViewModel, int> serviceB, ICrudApi<CondicionesPagosViewModel, int> condiciones)
        {
            this.service = service;
            this.serviceC = serviceC;
            this.serviceD = serviceD;
            this.serviceB = serviceB;
            this.condiciones = condiciones;

        }
        public async Task<IActionResult> OnGetAsync(int id)
        {
            try
            {
                var Roles = ((ClaimsIdentity)User.Identity).Claims.Where(d => d.Type == "Roles").Select(s1 => s1.Value).FirstOrDefault().Split("|");
                if (string.IsNullOrEmpty(Roles.Where(a => a == "7").FirstOrDefault()))
                {
                    return RedirectToPage("/NoPermiso");
                }
                Cliente = await service.ObtenerPorId(id);
                Cantones = await serviceC.ObtenerLista("");
                Distritos = await serviceD.ObtenerLista("");
                Barrios = await serviceB.ObtenerLista("");
                Condiciones = await condiciones.ObtenerLista("");


                return Page();
            }
            catch (Exception ex)
            {
                Cliente = await service.ObtenerPorId(id);
                Cantones = await serviceC.ObtenerLista("");
                Distritos = await serviceD.ObtenerLista("");
                Barrios = await serviceB.ObtenerLista("");

                ModelState.AddModelError(string.Empty, ex.Message);
                return Page();
            }
        }
        public async Task<IActionResult> OnPostAsync()
        {
            try
            {
                if (Cliente == null ||
                    string.IsNullOrWhiteSpace(Cliente.Cedula) ||
                    string.IsNullOrWhiteSpace(Cliente.Nombre) ||
                    string.IsNullOrWhiteSpace(Cliente.Email) ||
                    string.IsNullOrWhiteSpace(Cliente.Telefono) ||
                    string.IsNullOrWhiteSpace(Cliente.Sennas) ||
                    Cliente.Provincia == 0 ||
                    Cliente.Canton == "" ||
                    Cliente.Distrito == "" ||
                    Cliente.Barrio == "")
                {
                    Cantones = await serviceC.ObtenerLista("");
                    Distritos = await serviceD.ObtenerLista("");
                    Barrios = await serviceB.ObtenerLista("");

                    ModelState.AddModelError(string.Empty, "Debe completar todos los datos obligatorios.");
                    return Page();
                }
                await service.Editar(Cliente);
                return RedirectToPage("./Index");
            }
            catch (ApiException ex)
            {
                Errores error = JsonConvert.DeserializeObject<Errores>(ex.Content.ToString());
                ModelState.AddModelError(string.Empty, error.Message);

                return Page();
            }
        }
    }
}

