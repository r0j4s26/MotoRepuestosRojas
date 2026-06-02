using FORECAST.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using MotoRepuestosRojas.Models;
using Newtonsoft.Json;
using Refit;
using Sicsoft.Checkin.Web.Servicios;
using System.Security.Claims;
using System.Threading.Tasks;
using System;
using System.Linq;

namespace FORECAST.Pages.Productos
{
    public class NuevoModel : PageModel
    {

        private readonly ICrudApi<ProductosViewModel, int> service;
        private readonly ICrudApi<BodegasViewModel, int> serviceBodegas;
        private readonly ICrudApi<CategoriasViewModel, int> categorias;


        [BindProperty]
        public ProductosViewModel Producto { get; set; }

        [BindProperty(SupportsGet = true)]
        public ParametrosFiltros filtro { get; set; }


        [BindProperty]
        public BodegasViewModel[] Bodegas { get; set; }


        [BindProperty]
        public CategoriasViewModel[] Categorias { get; set; }



        public NuevoModel(ICrudApi<ProductosViewModel, int> service, ICrudApi<CategoriasViewModel, int> categorias, ICrudApi<BodegasViewModel, int> serviceBodegas) //CTOR 
        {
            this.service = service;
            this.serviceBodegas = serviceBodegas;
            this.categorias = categorias;

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
                Bodegas = await serviceBodegas.ObtenerLista("");
                Categorias = await categorias.ObtenerLista("");

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
                await service.Agregar(Producto);
                return RedirectToPage("./Index");
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
    }
}
