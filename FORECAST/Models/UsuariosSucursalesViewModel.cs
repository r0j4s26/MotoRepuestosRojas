using System.ComponentModel.DataAnnotations.Schema;

namespace Planillas.Models
{
    public class UsuariosSucursalesViewModel
    {

        public int idUsuario { get; set; }

        public string CodSuc { get; set; }

        public int idSucursal { get; set; }
    }
}
