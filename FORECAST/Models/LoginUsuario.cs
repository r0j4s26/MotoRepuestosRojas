using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace Sicsoft.CostaRica.Checkin.Web.Models
{
    public class LoginUsuario
    {
        public int idLogin { get; set; }

        public int id { get; set; }

        public string CedulaJuridica { get; set; }

        public int idRol { get; set; }
        public string Email { get; set; }

        public string NombreUsuario { get; set; }

        public string Nombre { get; set; }

        public string Clave { get; set; }
        public bool Activo { get; set; }
        public int idLoginAceptacion { get; set; }
    }
}
