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
using MotoRepuestosRojas.Models;

namespace MotoRepuestosRojas.Pages.Categorias
{
    public class NuevoModel : PageModel
    {
        private readonly ICrudApi<CategoriasViewModel, int> service;

        [BindProperty]
        public CategoriasViewModel Categorias { get; set; }


        public NuevoModel(ICrudApi<CategoriasViewModel, int> service)
        {
            this.service = service;


        }
        public async Task<IActionResult> OnGetAsync()
        {
            try
            {
                var Roles = ((ClaimsIdentity)User.Identity).Claims.Where(d => d.Type == "Roles").Select(s1 => s1.Value).FirstOrDefault().Split("|");
                if (string.IsNullOrEmpty(Roles.Where(a => a == "13").FirstOrDefault()))
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
                if (Categorias == null ||
                  string.IsNullOrWhiteSpace(Categorias.Nombre))
                {
                    ModelState.AddModelError(string.Empty, "Debe completar todos los datos obligatorios.");
                    return Page();
                }
                await service.Agregar(Categorias);
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