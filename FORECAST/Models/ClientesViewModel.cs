namespace FORECAST.Models
{
    public class ClientesViewModel
    {
        public int id { get; set; }

        public int idCondicionPago { get; set; }

        public string Nombre { get; set; }

        public string TipoCedula { get; set; }

        public string Cedula { get; set; }

        public string Email { get; set; }

        public string Telefono { get; set; }

        public int Provincia { get; set; }

        public string Canton { get; set; }

        public string Distrito { get; set; }

        public string Barrio { get; set; }

        public string Sennas { get; set; }

        public bool Activo { get; set; }
    }
}
