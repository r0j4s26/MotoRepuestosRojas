using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace FORECAST.Models
{
    public class UsuariosViewModel
    {
        public int id { get; set; }

        public int idRol { get; set; }


        public string Nombre { get; set; }


        public string NombreUsuario { get; set; }

        public string Clave { get; set; }


        public bool Activo { get; set; }

        public string Cedula { get; set; }


    }
}
