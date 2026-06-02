using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace MotoRepuestosRojas.Models
{
    public class ProductosViewModel
    {
        public int id { get; set; }

        public string Codigo { get; set; }

        public string Nombre { get; set; }

        public int idBodega { get; set; }

        public int idCategoria { get; set; }

        public decimal PrecioUnitario { get; set; }

        public decimal Costo { get; set; }

        public decimal Stock { get; set; }
    }
}
