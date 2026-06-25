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

namespace FORECAST.Pages.Impuestos
{
    public class NuevoModel : PageModel
    {
        private readonly ICrudApi<ImpuestosViewModel, int> service;

        [BindProperty]
        public ImpuestosViewModel Impuestos { get; set; }


        public NuevoModel(ICrudApi<ImpuestosViewModel, int> service)
        {
            this.service = service;


        }
        public async Task<IActionResult> OnGetAsync()
        {
            try
            {
                var Roles = ((ClaimsIdentity)User.Identity).Claims.Where(d => d.Type == "Roles").Select(s1 => s1.Value).FirstOrDefault().Split("|");
                if (string.IsNullOrEmpty(Roles.Where(a => a == "15").FirstOrDefault()))
                {
                    return RedirectToPage("/NoPermiso");
                }




                return Page();
            }
            catch (Exception ex)
            {

                ModelState.AddModelError(string.Empty, ex.Message);
                return Page();
            }
        }
        public async Task<IActionResult> OnPostAsync()
        {
            try
            {
                if (Impuestos == null ||
          string.IsNullOrWhiteSpace(Impuestos.Codigo)
          || Impuestos.Tarifa == null || Impuestos.Tarifa < 0
          )
                {
                    ModelState.AddModelError(string.Empty, "Debe completar todos los datos obligatorios.");
                    return Page();
                }
                await service.Agregar(Impuestos);
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