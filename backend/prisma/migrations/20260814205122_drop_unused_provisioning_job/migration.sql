-- El modelo ProvisioningJob nunca se uso (los jobs reales viven en
-- user/group/teardown_provisioning_jobs). La tabla esta vacia.
DROP TABLE IF EXISTS "provisioning_jobs";
