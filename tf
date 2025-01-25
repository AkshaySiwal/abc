cat variables.tf 
variable "wiz_tags" {
  description = "Tags to be applied to Wiz IAM resources"
  type = map(string)
  default = {
    Terraform = "true"
    ticket    = "CMT-14401"
    role      = "security_wiz"
  }
}

variable "wiz_principal_arn" {
  description = "ARN of the Wiz principal that will assume the role"
  type        = string
  default     = "arn:aws:iam::197171649850:root"
}




cat main.tf 
module "wiz_iam" {
  source = "/Users/akshayakshay/Downloads/terraform-modules/modules/iam/wiz"
  
  wiz_tags         = var.wiz_tags
  wiz_principal_arn = var.wiz_principal_arn
}




cat backend.tf 
terraform {
  required_version = ">= 0.15"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 3.38"
    }
  }

  backend "remote" {
    hostname     = "app.terraform.io"
    organization = "your-org-name"

    workspaces {
      name = "wiz-iam-dev"
    }
  }
}

provider "aws" {
  region = "ap-northeast-2"
  
  assume_role {
    role_arn     = "arn:aws:iam::038462757316:role/cloud_management_terraform-ec2-role-v2"
    session_name = "TFESESSION"
  }

  ignore_tags {
    key_prefixes = ["kubernetes.io/cluster/"]
  }
}


cat outputs.tf 
output "role" {
  description = "Name of the created IAM role for Wiz"
  value       = module.wiz_iam
}
