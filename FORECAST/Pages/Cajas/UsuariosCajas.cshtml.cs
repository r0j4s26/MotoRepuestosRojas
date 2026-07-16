
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Newtonsoft.Json;

using Refit;
using Sicsoft.Checkin.Web.Servicios;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using System;
using Castle.Core.Configuration;
using FORECAST.Models;
using MotoRepuestosRojas.Models;
using WMS.Models;

namespace MotoRepuestosRojas.Pages.Cajas
{
    public class UsuariosCajasModel : PageModel
    {
        private readonly IConfiguration configuration;
        private readonly ICrudApi<CajasViewModel, int> bodegas;
        private readonly ICrudApi<UsuariosViewModel, int> usuarios;
        private readonly ICrudApi<UsuariosCajasViewModel, int> usuBod;
        private readonly ICrudApi<RolesViewModel, int> roles;



        [BindProperty]
        public CajasViewModel Cajas { get; set; }

        [BindProperty]
        public UsuariosCajasViewModel[] UsuBodMios { get; set; }

        [BindProperty]
        public UsuariosCajasViewModel[] UsuBod { get; set; }

        [BindProperty]
        public UsuariosViewModel[] UsuariosMiosS { get; set; }

        [BindProperty]
        public UsuariosViewModel[] UsuariosS { get; set; }
        public UsuariosCajasModel(ICrudApi<UsuariosViewModel, int> usuarios, ICrudApi<CajasViewModel, int> bodegas, ICrudApi<UsuariosCajasViewModel, int> usuBod, ICrudApi<RolesViewModel, int> roles)
        {
            this.usuarios = usuarios;
            this.bodegas = bodegas;
            this.usuBod = usuBod;
            this.roles = roles;
        }

        public async Task<IActionResult> OnGetAsync(int id)
        {
            try
            {
                var Roles1 = ((ClaimsIdentity)User.Identity).Claims.Where(d => d.Type == "Roles").Select(s1 => s1.Value).FirstOrDefault().Split("|");
                if (string.IsNullOrEmpty(Roles1.Where(a => a == "26").FirstOrDefault()))
                {
                    return RedirectToPage("/NoPermiso");
                }

                Cajas = await bodegas.ObtenerPorId(id);







                return Page();
            }
            catch (ApiException ex)
            {
                Errores error = JsonConvert.DeserializeObject<Errores>(ex.Content.ToString());
                ModelState.AddModelError(string.Empty, error.Message);

                return Page();
            }
        }

        public async Task<IActionResult> OnGetCajas(int id)
        {
            try
            {
                var Roles = await roles.ObtenerLista("");
                ParametrosFiltros filtro = new ParametrosFiltros();
                var Rol = Roles.Where(a => !a.NombreRol.ToLower().Contains("Admin".ToLower())).FirstOrDefault();
                filtro.Codigo1 = 1;
          


                var UsuariosGenerales = await usuarios.ObtenerLista(filtro); //Carga todos los usuarios que existan
                //UsuariosGenerales = UsuariosGenerales.Where(a => a.Activo == true).ToArray();

                filtro.Codigo1 = id;
                UsuBodMios = await usuBod.ObtenerLista(filtro); //Llamada a la tabla de seguridadRolesModulos que contenga el idRol

                UsuariosMiosS = new UsuariosViewModel[UsuBodMios.Length]; //hace un vector del tamaño de la cantidad de seguridadrolesmodulos que existen 

                for (int j = 0; j < UsuariosMiosS.Length; j++)
                {
                    UsuariosMiosS[j] = new UsuariosViewModel();
                }



                var i = 0;
                foreach (var item in UsuBodMios.Where(a => a.idUsuario != 0))
                {
                    var Usuario = UsuariosGenerales.Where(a => a.id == item.idUsuario).FirstOrDefault(); //Busco el modulo en los mios
                    if (Usuario != null)
                    {
                        UsuariosMiosS[i].id = Usuario.id;
                        UsuariosMiosS[i].Nombre = Usuario.Nombre;

                        i++;
                    }


                }


                foreach (var item in UsuariosMiosS.Where(a => a.id != 0))
                {
                    UsuariosGenerales = UsuariosGenerales.Where(a => a.id != item.id).ToArray();
                }



                var resp = new
                {
                    UsuariosMiosS,
                    UsuariosGenerales
                };



                return new JsonResult(resp);
            }
            catch (ApiException ex)
            {
                Errores error = JsonConvert.DeserializeObject<Errores>(ex.Content.ToString());
                ModelState.AddModelError(string.Empty, error.Message);

                return new JsonResult(error);
            }
        }

        public async Task<IActionResult> OnPostGenerar(string recibidos)
        {
            try
            {
                recibidos = recibidos.Replace("_", " ");
                RecibidoUsuarios recibido = JsonConvert.DeserializeObject<RecibidoUsuarios>(recibidos);
                recibido.usuarios = recibido.usuarios.Replace("ProdCadenaM", "usuBod");
                VectorUsuarios usuariosCajas1 = JsonConvert.DeserializeObject<VectorUsuarios>(recibido.usuarios);
                UsuariosCajasViewModel[] usuariosCajas = new UsuariosCajasViewModel[usuariosCajas1.usuBod.Length];


                short cantidad = 0;
                if (usuariosCajas.Length > 0)
                {

                    foreach (var item in usuariosCajas1.usuBod)
                    {

                        usuariosCajas[cantidad] = new UsuariosCajasViewModel();
                        usuariosCajas[cantidad].idCaja = recibido.idCaja;
                        usuariosCajas[cantidad].idUsuario = item.id;

                        cantidad++;
                    }
                }
                else
                {
                    usuariosCajas = new UsuariosCajasViewModel[1];
                    usuariosCajas[0] = new UsuariosCajasViewModel();
                    usuariosCajas[0].idCaja = recibido.idCaja;
                    usuariosCajas[0].idUsuario = 0;
                }

                await usuBod.AgregarBulk(usuariosCajas);
                return new JsonResult(true);
            }
            catch (ApiException ex)
            {
                Errores error = JsonConvert.DeserializeObject<Errores>(ex.Content.ToString());
                ModelState.AddModelError(string.Empty, error.Message);

                return new JsonResult(false);
            }
            catch (Exception ex)
            {

                ModelState.AddModelError(string.Empty, ex.Message);

                return new JsonResult(false);
            }
        }
    }
}
