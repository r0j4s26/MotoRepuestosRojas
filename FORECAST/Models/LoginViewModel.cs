using System.ComponentModel.DataAnnotations;

namespace Sicsoft.Checkin.Web.Models
{
    public class LoginViewModel
    {
        [Required]
        [Display(Name = "User name")]
        public string nombreUsuario { get; set; }

        [Required]
        [DataType(DataType.Password)]
        [Display(Name = "Password")]
        public string clave { get; set; }

    }
}
