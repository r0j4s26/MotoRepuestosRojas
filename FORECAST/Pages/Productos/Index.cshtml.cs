using Castle.Core.Configuration;
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

namespace FORECAST.Pages.Productos
{
    public class IndexModel : PageModel
    {
        private readonly IConfiguration configuration;
        private readonly ICrudApi<ProductosViewModel, int> service;
        private readonly ICrudApi<BodegasViewModel, int> serviceBodegas;
        private readonly ICrudApi<CategoriasViewModel, int> categorias;




        [BindProperty(SupportsGet = true)]
        public ParametrosFiltros filtro { get; set; }

        [BindProperty]
        public ProductosViewModel[] Objeto { get; set; }

        [BindProperty]
        public BodegasViewModel[] Bodegas { get; set; }

        [BindProperty]
        public CategoriasViewModel[] Categorias { get; set; }

 



        public IndexModel(ICrudApi<ProductosViewModel, int> service, ICrudApi<BodegasViewModel, int> serviceBodegas, ICrudApi<CategoriasViewModel, int> categorias)
        {
            this.service = service;
            this.serviceBodegas = serviceBodegas;
            this.categorias= categorias;


        }
        public async Task<IActionResult> OnGetAsync()
        {
            try
            {
                var Roles = ((ClaimsIdentity)User.Identity).Claims.Where(d => d.Type == "Roles").Select(s1 => s1.Value).FirstOrDefault().Split("|");
                if (string.IsNullOrEmpty(Roles.Where(a => a == "16").FirstOrDefault()))
                {
                    return RedirectToPage("/NoPermiso");
                }

                Bodegas = await serviceBodegas.ObtenerLista("");
                Categorias = await categorias.ObtenerLista("");


                Objeto = await service.ObtenerLista(filtro);


                return Page();
            }
            catch (ApiException ex)
            {
                Errores error = JsonConvert.DeserializeObject<Errores>(ex.Content.ToString());
                ModelState.AddModelError(string.Empty, error.Message);

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
        }

    }
}
